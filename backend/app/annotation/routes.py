"""Annotation endpoints: save/submit, consensus, adjudication, dashboard, export, earnings."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.annotation.consensus import compute_consensus
from app.annotation.schemas import (
    AdjudicateIn,
    AdjudicateOut,
    AnnotationIn,
    AnnotationOut,
    ConsensusOut,
    DashboardOut,
    Disagreement,
    EarningsOut,
    EarningsRow,
    ExportOut,
    ExportTask,
    FlaggedItem,
)
from app.db import get_session
from app.models import Annotation, AuditEvent, Gig, Segment, Source, Task, TaskStatus, User, utcnow

from app.ai import check_annotation, explain_disagreement

router = APIRouter(tags=["annotation"])


# --- Helpers ---

def get_task_or_404(session: Session, task_id: str) -> Task:
    task = session.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task


def get_gig_or_404(session: Session, gig_id: str) -> Gig:
    gig = session.get(Gig, gig_id)
    if gig is None:
        raise HTTPException(status_code=404, detail=f"Gig {gig_id} not found")
    return gig


def get_user_or_404(session: Session, user_id: str) -> User:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    return user


def task_annotations(session: Session, task_id: str) -> list[Annotation]:
    return list(session.exec(select(Annotation).where(Annotation.task_id == task_id)).all())


def submitted_rater_annotations(session: Session, task: Task) -> list[Annotation]:
    """Submitted annotations by assigned raters, in assigned_rater_ids order."""
    by_rater = {
        a.rater_id: a
        for a in task_annotations(session, task.id)
        if a.submitted_at is not None and a.rater_id in task.assigned_rater_ids
    }
    return [by_rater[r] for r in task.assigned_rater_ids if r in by_rater]


def task_consensus(
    session: Session, task: Task
) -> tuple[Annotation, Annotation, float, list[dict[str, Any]], int] | None:
    """Consensus between the first two submitted assigned raters, or None if not ready."""
    submitted = submitted_rater_annotations(session, task)
    if len(submitted) < 2:
        return None
    ann_a, ann_b = submitted[0], submitted[1]
    score, disagreements, total = compute_consensus(ann_a.segments, ann_b.segments)
    return ann_a, ann_b, score, disagreements, total


def without_meta(segment: dict[str, Any]) -> dict[str, Any]:
    """Segment content without source/edited, for comparing against AI output."""
    return {k: v for k, v in segment.items() if k not in ("source", "edited")}


def mark_edited(segments: list[Segment], ai_segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Dump segments; any source='ai' segment that no longer equals an AI segment gets edited=True."""
    ai_contents = [without_meta(Segment.model_validate(s).model_dump(mode="json")) for s in ai_segments]
    result: list[dict[str, Any]] = []
    for seg in segments:
        data = seg.model_dump(mode="json")
        if data["source"] == Source.ai.value and without_meta(data) not in ai_contents:
            data["edited"] = True
        result.append(data)
    return result


def add_audit(
    session: Session, task_id: str, actor_id: str, action: str, before: Any, after: Any
) -> None:
    """Append-only: audit events are only ever inserted."""
    session.add(AuditEvent(task_id=task_id, actor_id=actor_id, action=action, before=before, after=after))


def set_task_status(session: Session, task: Task, actor_id: str, new_status: TaskStatus) -> None:
    if task.status == new_status:
        return
    add_audit(session, task.id, actor_id, "task_status_changed", task.status.value, new_status.value)
    task.status = new_status
    session.add(task)


# --- Endpoints ---

@router.post("/tasks/{task_id}/annotations", response_model=AnnotationOut)
def save_annotation(
    task_id: str, body: AnnotationIn, session: Session = Depends(get_session)
) -> AnnotationOut:
    task = get_task_or_404(session, task_id)
    get_user_or_404(session, body.rater_id)
    if body.rater_id not in task.assigned_rater_ids:
        raise HTTPException(status_code=403, detail="Rater is not assigned to this task")
    if task.status in (TaskStatus.flagged, TaskStatus.resolved):
        raise HTTPException(status_code=409, detail=f"Task is {task.status.value}; annotations are locked")

    annotation = session.exec(
        select(Annotation).where(Annotation.task_id == task_id, Annotation.rater_id == body.rater_id)
    ).first()
    if annotation is not None and annotation.submitted_at is not None:
        raise HTTPException(status_code=409, detail="Annotation already submitted")

    new_segments = mark_edited(body.segments, task.ai_segments)
    # Baseline for the diff: the rater's last draft, or the AI pre-annotation on first save.
    old_segments = annotation.segments if annotation is not None else task.ai_segments

    # One audit event per changed segment (compared by position).
    for i in range(max(len(old_segments), len(new_segments))):
        before = old_segments[i] if i < len(old_segments) else None
        after = new_segments[i] if i < len(new_segments) else None
        if before == after:
            continue
        if before is None:
            action = "segment_added"
        elif after is None:
            action = "segment_removed"
        else:
            action = "segment_edited"
        add_audit(session, task_id, body.rater_id, action, before, after)

    if annotation is None:
        annotation = Annotation(task_id=task_id, rater_id=body.rater_id, segments=new_segments)
    else:
        annotation.segments = new_segments
    if body.submit:
        annotation.submitted_at = utcnow()
    session.add(annotation)

    add_audit(
        session, task_id, body.rater_id,
        "annotation_submitted" if body.submit else "annotation_saved",
        None, {"segment_count": len(new_segments)},
    )

    if task.status == TaskStatus.open:
        set_task_status(session, task, body.rater_id, TaskStatus.in_progress)

    session.flush()  # make this annotation visible to the consensus query below

    if body.submit:
        issues = check_annotation(task.ai_segments, new_segments)
        if issues:
            add_audit(
                session, task_id, body.rater_id, "ai_human_disagreement",
                None, [issue.model_dump(mode="json") for issue in issues],
            )
        submitted = submitted_rater_annotations(session, task)
        if len(submitted) == len(task.assigned_rater_ids):
            result = task_consensus(session, task)
            has_disagreements = result is not None and len(result[3]) > 0
            set_task_status(
                session, task, body.rater_id,
                TaskStatus.flagged if has_disagreements else TaskStatus.resolved,
            )

    session.commit()
    session.refresh(annotation)
    session.refresh(task)
    return AnnotationOut(
        id=annotation.id,
        task_id=annotation.task_id,
        rater_id=annotation.rater_id,
        segments=[Segment.model_validate(s) for s in annotation.segments],
        submitted_at=annotation.submitted_at,
        task_status=task.status,
    )


@router.get("/tasks/{task_id}/consensus", response_model=ConsensusOut)
def get_consensus(
    task_id: str, explain: bool = True, session: Session = Depends(get_session)
) -> ConsensusOut:
    """Agreement between the assigned raters. `explain=false` skips the Gemini explanations."""
    task = get_task_or_404(session, task_id)
    submitted_ids = [a.rater_id for a in submitted_rater_annotations(session, task)]
    result = task_consensus(session, task)
    if result is None:
        return ConsensusOut(
            task_id=task.id, status=task.status, ready=False,
            rater_a_id=None, rater_b_id=None, submitted_rater_ids=submitted_ids,
            agreement_score=None, total_segments=0, disagreements=[],
        )

    ann_a, ann_b, score, raw_disagreements, total = result
    gig = session.get(Gig, task.gig_id)
    sop_for_explain: list | dict = []
    if gig is not None:
        sop_for_explain = (gig.label_schema or {}).get("sop") or gig.sop_steps

    disagreements: list[Disagreement] = []
    for index, d in enumerate(raw_disagreements):
        explanation: str | None = None
        if explain:
            try:
                explanation = explain_disagreement(d["segment_a"], d["segment_b"], sop_for_explain)
            except Exception:
                explanation = None
        disagreements.append(Disagreement(
            index=index,
            reasons=d["reasons"],
            segment_a=Segment.model_validate(d["segment_a"]) if d["segment_a"] else None,
            segment_b=Segment.model_validate(d["segment_b"]) if d["segment_b"] else None,
            explanation=explanation,
        ))

    return ConsensusOut(
        task_id=task.id, status=task.status, ready=True,
        rater_a_id=ann_a.rater_id, rater_b_id=ann_b.rater_id, submitted_rater_ids=submitted_ids,
        agreement_score=score, total_segments=total, disagreements=disagreements,
    )


@router.post("/tasks/{task_id}/adjudicate", response_model=AdjudicateOut)
def adjudicate(
    task_id: str, body: AdjudicateIn, session: Session = Depends(get_session)
) -> AdjudicateOut:
    task = get_task_or_404(session, task_id)
    get_user_or_404(session, body.adjudicator_id)
    if body.adjudicator_id in task.assigned_rater_ids:
        raise HTTPException(status_code=400, detail="Adjudicator must not be an assigned rater")
    if task.status != TaskStatus.flagged:
        raise HTTPException(status_code=409, detail=f"Task is {task.status.value}; only flagged tasks can be adjudicated")

    segments = [s.model_dump(mode="json") for s in body.segments]
    # The final agreed result is stored as a submitted annotation by the adjudicator.
    annotation = session.exec(
        select(Annotation).where(Annotation.task_id == task_id, Annotation.rater_id == body.adjudicator_id)
    ).first()
    before = annotation.segments if annotation is not None else None
    if annotation is None:
        annotation = Annotation(task_id=task_id, rater_id=body.adjudicator_id, segments=segments)
    else:
        annotation.segments = segments
    annotation.submitted_at = utcnow()
    session.add(annotation)

    add_audit(session, task_id, body.adjudicator_id, "adjudicated", before, segments)
    set_task_status(session, task, body.adjudicator_id, TaskStatus.resolved)

    session.commit()
    session.refresh(annotation)
    session.refresh(task)
    return AdjudicateOut(
        task_id=task.id,
        task_status=task.status,
        annotation_id=annotation.id,
        segments=[Segment.model_validate(s) for s in annotation.segments],
    )


@router.get("/gigs/{gig_id}/dashboard", response_model=DashboardOut)
def gig_dashboard(gig_id: str, session: Session = Depends(get_session)) -> DashboardOut:
    gig = get_gig_or_404(session, gig_id)
    tasks = list(session.exec(select(Task).where(Task.gig_id == gig_id)).all())

    status_counts = {s.value: 0 for s in TaskStatus}
    scores: list[float] = []
    flagged_items: list[FlaggedItem] = []
    for task in tasks:
        status_counts[task.status.value] += 1
        result = task_consensus(session, task)
        if result is None:
            continue
        _, _, score, disagreements, _ = result
        scores.append(score)
        if task.status == TaskStatus.flagged:
            flagged_items.append(FlaggedItem(task_id=task.id, disagreement_count=len(disagreements)))

    total = len(tasks)
    return DashboardOut(
        gig_id=gig.id,
        title=gig.title,
        total_tasks=total,
        status_counts=status_counts,
        progress=status_counts[TaskStatus.resolved.value] / total if total > 0 else 0.0,
        agreement_rate=sum(scores) / len(scores) if scores else None,
        flagged_items=flagged_items,
    )


@router.get("/gigs/{gig_id}/export", response_model=ExportOut)
def export_gig(gig_id: str, session: Session = Depends(get_session)) -> ExportOut:
    gig = get_gig_or_404(session, gig_id)
    tasks = session.exec(
        select(Task).where(Task.gig_id == gig_id, Task.status == TaskStatus.resolved)
    ).all()

    exported: list[ExportTask] = []
    for task in tasks:
        adjudicated = [
            a for a in task_annotations(session, task.id)
            if a.submitted_at is not None and a.rater_id not in task.assigned_rater_ids
        ]
        if adjudicated:
            final = max(adjudicated, key=lambda a: a.submitted_at)
            source = "adjudicated"
        else:
            result = task_consensus(session, task)
            if result is None or len(result[3]) > 0:
                continue  # resolved without a usable final annotation; skip
            final = result[0]  # full agreement: first assigned rater's annotation
            source = "consensus"
        exported.append(ExportTask(
            task_id=task.id,
            source=source,
            annotator_id=final.rater_id,
            segments=[Segment.model_validate(s) for s in final.segments],
        ))

    return ExportOut(
        gig_id=gig.id,
        title=gig.title,
        data_type=gig.data_type.value,
        video_url=gig.video_url,
        sop_steps=gig.sop_steps,
        label_schema=gig.label_schema,
        exported_at=utcnow(),
        tasks=exported,
    )


@router.get("/experts/{expert_id}/earnings", response_model=EarningsOut)
def expert_earnings(expert_id: str, session: Session = Depends(get_session)) -> EarningsOut:
    """Display only: submitted annotations x pay_per_task. No payment logic."""
    get_user_or_404(session, expert_id)
    annotations = session.exec(
        select(Annotation).where(Annotation.rater_id == expert_id, Annotation.submitted_at.is_not(None))
    ).all()

    counts: dict[str, int] = {}
    for annotation in annotations:
        task = session.get(Task, annotation.task_id)
        if task is not None:
            counts[task.gig_id] = counts.get(task.gig_id, 0) + 1

    rows: list[EarningsRow] = []
    for gig_id, count in counts.items():
        gig = session.get(Gig, gig_id)
        if gig is None:
            continue
        rows.append(EarningsRow(
            gig_id=gig.id,
            gig_title=gig.title,
            tasks_completed=count,
            pay_per_task=gig.pay_per_task,
            amount=round(count * gig.pay_per_task, 2),
        ))

    return EarningsOut(
        expert_id=expert_id,
        rows=rows,
        total_tasks=sum(r.tasks_completed for r in rows),
        total_amount=round(sum(r.amount for r in rows), 2),
    )
