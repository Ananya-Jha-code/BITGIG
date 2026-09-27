from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from app.core.pipeline import get_ai_segments
from app.core.schemas import GigDetail, TaskDetail, TaskListItem
from app.core.storage import save_upload
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
    video: UploadFile = File(...),
    sop_file: UploadFile | None = File(None, description="Plain-text SOP, one step per line"),
    session: Session = Depends(get_session),
) -> GigDetail:
    company = session.get(User, company_id)
    if company is None or company.role != Role.company:
        raise HTTPException(400, "company_id must be an existing company user")

    steps = _parse_sop(sop_steps)
    if not steps and sop_file is not None:
        steps = _parse_sop(sop_file.file.read().decode("utf-8", errors="ignore"))
    if not steps:
        raise HTTPException(400, "Provide SOP steps (text or sop_file)")

    video_path, video_url = save_upload(video)

    gig = Gig(
        company_id=company_id,
        title=title,
        data_type=DataType.lab_video,
        video_url=video_url,
        sop_steps=steps,
        label_schema={
            "labels": [l.value for l in SegmentLabel],
            "anomalies": [a.value for a in Anomaly],
        },
        raters_required=raters_required,
        required_specialty=required_specialty,
        pay_per_task=pay_per_task,
        status=GigStatus.processing,
    )
    session.add(gig)
    session.commit()

    # Runs inline: cached demo videos return instantly.
    ai_segments = get_ai_segments(video_path, video.filename or "", steps)

    task = Task(
        gig_id=gig.id,
        assigned_rater_ids=_pick_raters(session, required_specialty, raters_required),
        ai_segments=ai_segments,
        status=TaskStatus.open,
    )
    gig.status = GigStatus.open
    session.add(task)
    session.add(gig)
    session.commit()
    session.refresh(gig)
    session.refresh(task)
    return GigDetail(gig=gig, tasks=[task])


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
