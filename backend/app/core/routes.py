import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from app.ai.cache import clip_slug_from_name, load_cached_segments
from app.ai.segment import segment_video
from app.ai.sop import normalize_sop, sop_lines
from app.core.pipeline import get_ai_segments
from app.core.schemas import ClipSegmentsOut, GigDetail, SegmentVideoOut, TaskDetail, TaskListItem
from app.core.storage import DEMO_DIR, save_upload
from app.db import get_session
from app.models import (
    Anomaly,
    CredentialStatus,
    DataType,
    Gig,
    GigStatus,
    Role,
    SegmentLabel,
    Task,
    TaskStatus,
    User,
)

router = APIRouter(tags=["core"])


# --- Users (no auth: the frontend picks one of these to act as) ---

@router.get("/users", response_model=list[User])
def list_users(role: Role | None = None, session: Session = Depends(get_session)) -> list[User]:
    query = select(User).order_by(User.id)
    if role is not None:
        query = query.where(User.role == role)
    return list(session.exec(query))


@router.get("/users/{user_id}", response_model=User)
def get_user(user_id: str, session: Session = Depends(get_session)) -> User:
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(404, "User not found")
    return user


# --- Gigs ---

def _parse_sop(text: str) -> list[str]:
    """One step per line; blank lines ignored."""
    return [line.strip() for line in text.splitlines() if line.strip()]


def _pick_raters(session: Session, specialty: str, count: int) -> list[str]:
    query = (
        select(User.id)
        .where(User.role == Role.expert)
        .where(User.specialty == specialty)
        .where(User.credential_status == CredentialStatus.verified)
        .order_by(User.id)
        .limit(count)
    )
    return list(session.exec(query))


@router.post("/gigs", response_model=GigDetail)
def create_gig(
    company_id: str = Form(...),
    title: str = Form(...),
    sop_steps: str = Form("", description="One SOP step per line"),
    required_specialty: str = Form("lab_technician"),
    pay_per_task: float = Form(10.0),
    raters_required: int = Form(2),
    videos: list[UploadFile] = File(..., description="The dataset: one task is created per video"),
    sop_file: UploadFile | None = File(None, description="Plain-text SOP, one step per line"),
    session: Session = Depends(get_session),
) -> GigDetail:
    company = session.get(User, company_id)
    if company is None or company.role != Role.company:
        raise HTTPException(400, "company_id must be an existing company user")

    steps = _parse_sop(sop_steps)
    sop_document = None
    if sop_file is not None:
        raw = sop_file.file.read().decode("utf-8", errors="ignore")
        name = (sop_file.filename or "").lower()
        if name.endswith(".json"):
            try:
                sop_document = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise HTTPException(400, f"SOP JSON is invalid: {exc}") from exc
            rich = normalize_sop(sop_document)
            sop_document = rich.model_dump(mode="json")
            if not steps:
                steps = sop_lines(rich)
        elif not steps:
            steps = _parse_sop(raw)
    if not steps:
        raise HTTPException(400, "Provide SOP steps (text or sop_file)")

    saved = [(save_upload(v), v.filename or "") for v in videos]
    first_name = saved[0][1] if saved else ""
    clip_slug = clip_slug_from_name(first_name)

    gig = Gig(
        company_id=company_id,
        title=title,
        data_type=DataType.lab_video,
        video_url=saved[0][0][1],
        sop_steps=steps,
        label_schema={
            "labels": [l.value for l in SegmentLabel],
            "anomalies": [a.value for a in Anomaly],
            "sop": sop_document,
            "clip_slug": clip_slug or None,
        },
        raters_required=raters_required,
        required_specialty=required_specialty,
        pay_per_task=pay_per_task,
        status=GigStatus.processing,
    )
    session.add(gig)
    session.commit()

    raters = _pick_raters(session, required_specialty, raters_required)
    tasks = []
    # Runs inline: cached demo videos return instantly.
    ai_sop = sop_document if sop_document is not None else steps
    for (video_path, video_url), name in saved:
        task = Task(
            gig_id=gig.id,
            video_url=video_url,
            assigned_rater_ids=raters,
            ai_segments=get_ai_segments(
                video_path,
                name,
                ai_sop,
                clip_slug=clip_slug_from_name(name) or None,
            ),
            status=TaskStatus.open,
        )
        session.add(task)
        tasks.append(task)
    gig.status = GigStatus.open
    session.add(gig)
    session.commit()
    session.refresh(gig)
    for task in tasks:
        session.refresh(task)
    return GigDetail(gig=gig, tasks=tasks)


@router.get("/gigs", response_model=list[Gig])
def list_gigs(company_id: str | None = None, session: Session = Depends(get_session)) -> list[Gig]:
    query = select(Gig).order_by(Gig.id)
    if company_id is not None:
        query = query.where(Gig.company_id == company_id)
    return list(session.exec(query))


@router.get("/gigs/{gig_id}", response_model=GigDetail)
def get_gig(gig_id: str, session: Session = Depends(get_session)) -> GigDetail:
    gig = session.get(Gig, gig_id)
    if gig is None:
        raise HTTPException(404, "Gig not found")
    tasks = list(session.exec(select(Task).where(Task.gig_id == gig_id).order_by(Task.id)))
    return GigDetail(gig=gig, tasks=tasks)


# --- Tasks ---

@router.get("/tasks", response_model=list[TaskListItem])
def list_tasks(
    specialty: str | None = None,
    rater_id: str | None = None,
    session: Session = Depends(get_session),
) -> list[TaskListItem]:
    """Marketplace listing. Filter by gig specialty and/or an assigned rater."""
    query = select(Task, Gig).join(Gig, Task.gig_id == Gig.id).order_by(Task.id)
    if specialty is not None:
        query = query.where(Gig.required_specialty == specialty)
    rows = session.exec(query).all()

    items = []
    for task, gig in rows:
        if rater_id is not None and rater_id not in task.assigned_rater_ids:
            continue
        items.append(TaskListItem(
            id=task.id,
            gig_id=gig.id,
            gig_title=gig.title,
            video_url=task.video_url or gig.video_url,
            data_type=gig.data_type,
            required_specialty=gig.required_specialty,
            pay_per_task=gig.pay_per_task,
            status=task.status,
            assigned_rater_ids=task.assigned_rater_ids,
            ai_segment_count=len(task.ai_segments),
        ))
    return items


@router.get("/tasks/{task_id}", response_model=TaskDetail)
def get_task(task_id: str, session: Session = Depends(get_session)) -> TaskDetail:
    task = session.get(Task, task_id)
    if task is None:
        raise HTTPException(404, "Task not found")
    gig = session.get(Gig, task.gig_id)
    return TaskDetail(task=task, gig=gig)


# --- AI pre-annotation for a single upload (no database) ---

@router.post("/ai/segment", response_model=SegmentVideoOut)
def segment_uploaded_video(
    video: UploadFile = File(...),
    sop_steps: str = Form(..., description="One SOP step per line"),
) -> SegmentVideoOut:
    """Save one video and pre-annotate it: cached result for demo clips, else live Gemini."""
    steps = _parse_sop(sop_steps)
    if not steps:
        raise HTTPException(400, "Provide at least one SOP step")

    video_path, video_url = save_upload(video)
    cached = load_cached_segments(video.filename or "")
    if cached is not None:
        return SegmentVideoOut(video_url=video_url, segments=cached, source="cache")

    result = segment_video(str(video_path), steps)
    if result.segments:
        return SegmentVideoOut(video_url=video_url, segments=result.segments, source="gemini")
    return SegmentVideoOut(video_url=video_url, segments=[], source="none", error=result.error)


@router.get("/ai/clips/{clip_slug}", response_model=ClipSegmentsOut)
def clip_segments(clip_slug: str, live: bool = False) -> ClipSegmentsOut:
    """A demo clip from demo/manifest.json with its AI segments.

    Cached segments by default, so the demo never waits on Gemini; live=true re-runs Gemini.
    """
    manifest = json.loads((DEMO_DIR / "manifest.json").read_text(encoding="utf-8"))
    match = next(
        ((g, c) for g in manifest["gigs"] for c in g["clips"] if c["clip_slug"] == clip_slug),
        None,
    )
    video_path = DEMO_DIR / "videos" / "clips" / f"{clip_slug}.mp4"
    if match is None or not video_path.is_file():
        raise HTTPException(404, f"No demo clip {clip_slug}")

    gig_spec, clip = match
    absent = clip.get("expected_absent_steps") or []
    sop_doc = json.loads((DEMO_DIR / gig_spec["sop"]).read_text(encoding="utf-8"))
    rich = normalize_sop(sop_doc, expected_absent_steps=absent)
    out = {
        "clip_slug": clip_slug,
        "title": gig_spec["title"],
        "video_url": f"/demo/videos/clips/{clip_slug}.mp4",
        "sop_steps": sop_lines(rich),
    }

    cached = None if live else load_cached_segments(clip_slug)
    if cached is not None:
        return ClipSegmentsOut(**out, segments=cached, source="cache")

    result = segment_video(str(video_path), rich, clip_slug=clip_slug, expected_absent_steps=absent)
    if result.segments:
        return ClipSegmentsOut(**out, segments=result.segments, source="gemini")
    return ClipSegmentsOut(**out, segments=load_cached_segments(clip_slug) or [], source="none", error=result.error)
