"""Pydantic shapes for the Gemini pipeline. Not database tables."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.models import Segment


AllowedLabel = Literal["aspirate", "dispense", "transfer", "other"]
AllowedAnomaly = Literal["spill", "contamination", "misalignment", "missed_step"]


class ModelSegment(BaseModel):
    """What Gemini is asked to emit. source/edited are set after parse."""

    start: float
    end: float
    label: AllowedLabel
    sop_step: int | None = None
    success: bool = True
    anomaly: AllowedAnomaly | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)


class ModelResponse(BaseModel):
    segments: list[ModelSegment]


class AiAnnotateResult(BaseModel):
    clip_slug: str | None = None
    video: str | None = None
    model: str
    prompt_version: str
    created_at: str
    needs_review: bool
    segments: list[Segment]
    error: str | None = None
    raw: dict[str, Any] | None = None


class Issue(BaseModel):
    reasons: list[str]
    ai_segment: dict[str, Any] | None = None
    human_segment: dict[str, Any] | None = None


class CacheEnvelope(BaseModel):
    clip_slug: str
    video: str
    model: str
    prompt_version: str
    created_at: str
    needs_review: bool = False
    segments: list[Segment]
    error: str | None = None
