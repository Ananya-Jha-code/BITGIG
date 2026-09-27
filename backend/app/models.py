"""SQLModel tables + shared shapes. Mirrors shared/schema.json; change both together."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


def new_id() -> str:
    return uuid4().hex


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# --- Enums ---

class Role(str, Enum):
    company = "company"
    expert = "expert"


class CredentialStatus(str, Enum):
    verified = "verified"
    pending = "pending"


class DataType(str, Enum):
    lab_video = "lab_video"
    pathology = "pathology"  # mock only
    variant = "variant"  # mock only


class GigStatus(str, Enum):
    processing = "processing"  # AI pipeline running
    open = "open"
    completed = "completed"


class TaskStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    submitted = "submitted"
    flagged = "flagged"
    resolved = "resolved"


class SegmentLabel(str, Enum):
    aspirate = "aspirate"
    dispense = "dispense"
    transfer = "transfer"
    other = "other"


class Anomaly(str, Enum):
    spill = "spill"
    contamination = "contamination"
    misalignment = "misalignment"
    missed_step = "missed_step"


class Source(str, Enum):
    ai = "ai"
    human = "human"


# --- Segment (not a table; stored as JSONB inside Task / Annotation) ---

class Segment(BaseModel):
    start: float
    end: float
    label: SegmentLabel
    sop_step: int | None = None
    success: bool = True
    anomaly: Anomaly | None = None
    source: Source = Source.human
    edited: bool = False
    confidence: float | None = None


# --- SOP (demo JSON in demo/sops/; stored on Gig.label_schema["sop"]) ---

class SopStep(BaseModel):
    index: int
    text: str
    default_label: SegmentLabel = SegmentLabel.other
    usually_absent_from_recording: bool = False
    absence_note: str | None = None
    model_config = {"extra": "allow"}


class RichSOP(BaseModel):
    sop_id: str = "inline"
    title: str = ""
    steps: list[SopStep]
    expected_absent_steps: list[int] = []
    model_config = {"extra": "allow"}


# --- Tables ---
# JSONB columns hold plain dicts/lists; validate with Segment at the API boundary.

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=new_id, primary_key=True)
    name: str
    role: Role
    specialty: str | None = None
    credential_status: CredentialStatus = CredentialStatus.pending


class Gig(SQLModel, table=True):
    __tablename__ = "gigs"

    id: str = Field(default_factory=new_id, primary_key=True)
    company_id: str = Field(foreign_key="users.id", index=True)
    title: str
    data_type: DataType = DataType.lab_video
    video_url: str | None = None  # first video of the dataset (cover); each Task has its own
    sop_steps: list[str] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False))
    label_schema: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSONB, nullable=False))
    raters_required: int = 2
    required_specialty: str | None = None
    pay_per_task: float = 0.0
    status: GigStatus = GigStatus.processing


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: str = Field(default_factory=new_id, primary_key=True)
    gig_id: str = Field(foreign_key="gigs.id", index=True)
    video_url: str | None = None  # one task per video in the gig's dataset
    assigned_rater_ids: list[str] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False))
    ai_segments: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False))
    status: TaskStatus = TaskStatus.open


class Annotation(SQLModel, table=True):
    __tablename__ = "annotations"

    id: str = Field(default_factory=new_id, primary_key=True)
    task_id: str = Field(foreign_key="tasks.id", index=True)
    rater_id: str = Field(foreign_key="users.id", index=True)
    segments: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False))
    submitted_at: datetime | None = None  # None = draft


class AuditEvent(SQLModel, table=True):
    """Append-only. Never update or delete rows."""

    __tablename__ = "audit_events"

    id: str = Field(default_factory=new_id, primary_key=True)
    task_id: str = Field(foreign_key="tasks.id", index=True)
    actor_id: str = Field(foreign_key="users.id")
    action: str
    before: Any = Field(default=None, sa_column=Column(JSONB))
    after: Any = Field(default=None, sa_column=Column(JSONB))
    timestamp: datetime = Field(default_factory=utcnow)
