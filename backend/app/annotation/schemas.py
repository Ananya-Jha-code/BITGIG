"""Request/response models for the annotation endpoints."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models import Segment, TaskStatus


# --- POST /tasks/{id}/annotations ---

class AnnotationIn(BaseModel):
    rater_id: str
    segments: list[Segment]
    submit: bool = False


class AnnotationOut(BaseModel):
    id: str
    task_id: str
    rater_id: str
    segments: list[Segment]
    submitted_at: datetime | None
    task_status: TaskStatus


# --- GET /tasks/{id}/consensus ---

class Disagreement(BaseModel):
    index: int
    reasons: list[str]  # label_mismatch | sop_step_mismatch | success_mismatch | boundary_mismatch | anomaly_mismatch | unmatched_segment
    segment_a: Segment | None  # rater A's segment (None if only rater B has it)
    segment_b: Segment | None  # rater B's segment (None if only rater A has it)
    explanation: str | None = None  # Gemini explanation, if available


class ConsensusOut(BaseModel):
    task_id: str
    status: TaskStatus
    ready: bool  # True once two assigned raters have submitted
    rater_a_id: str | None
    rater_b_id: str | None
    submitted_rater_ids: list[str]
    agreement_score: float | None  # None until ready
    total_segments: int
    disagreements: list[Disagreement]


# --- POST /tasks/{id}/adjudicate ---

class AdjudicateIn(BaseModel):
    adjudicator_id: str
    segments: list[Segment]


class AdjudicateOut(BaseModel):
    task_id: str
    task_status: TaskStatus
    annotation_id: str
    segments: list[Segment]


# --- GET /gigs/{id}/dashboard ---

class FlaggedItem(BaseModel):
    task_id: str
    disagreement_count: int


class DashboardOut(BaseModel):
    gig_id: str
    title: str
    total_tasks: int
    status_counts: dict[str, int]  # every TaskStatus value -> count
    progress: float  # resolved tasks / total tasks (0..1)
    agreement_rate: float | None  # mean agreement score over tasks with consensus
    flagged_items: list[FlaggedItem]


# --- GET /gigs/{id}/export ---

class ExportTask(BaseModel):
    task_id: str
    video_url: str | None
    source: str  # "adjudicated" | "consensus"
    annotator_id: str
    segments: list[Segment]


class ExportOut(BaseModel):
    gig_id: str
    title: str
    data_type: str
    video_url: str | None
    sop_steps: list[str]
    label_schema: dict[str, Any]
    exported_at: datetime
    tasks: list[ExportTask]


# --- GET /experts/{id}/earnings (display only, no payments) ---

class EarningsRow(BaseModel):
    gig_id: str
    gig_title: str
    tasks_completed: int
    pay_per_task: float
    amount: float


class EarningsOut(BaseModel):
    expert_id: str
    rows: list[EarningsRow]
    total_tasks: int
    total_amount: float
