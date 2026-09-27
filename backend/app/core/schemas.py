"""Request/response shapes for the core endpoints that aren't plain tables."""

from pydantic import BaseModel

from app.models import DataType, Gig, Task, TaskStatus


class GigDetail(BaseModel):
    gig: Gig
    tasks: list[Task]


class TaskListItem(BaseModel):
    """One card in the task marketplace."""

    id: str
    gig_id: str
    gig_title: str
    video_url: str | None
    data_type: DataType
    required_specialty: str | None
    pay_per_task: float
    status: TaskStatus
    assigned_rater_ids: list[str]
    ai_segment_count: int


class TaskDetail(BaseModel):
    """Everything the annotation workspace needs in one call."""

    task: Task
    gig: Gig
