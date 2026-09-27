"""Request/response shapes for the core endpoints that aren't plain tables."""

from typing import Literal

from pydantic import BaseModel

from app.models import DataType, Gig, Segment, Task, TaskStatus


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


class SegmentVideoOut(BaseModel):
    """Result of pre-annotating one uploaded video. No database rows are written."""

    video_url: str
    segments: list[Segment]
    source: Literal["cache", "gemini", "none"]
    error: str | None = None


class ClipSegmentsOut(BaseModel):
    """A demo clip with its SOP and AI segments, for the workspace. No database rows."""

    clip_slug: str
    title: str
    video_url: str
    sop_steps: list[str]
    segments: list[Segment]
    source: Literal["cache", "gemini", "none"]
    error: str | None = None
