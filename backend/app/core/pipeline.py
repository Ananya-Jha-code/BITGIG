"""Resolve AI pre-annotation for a gig video.

Order: cache for this clip_slug (demo never waits on Gemini), else live
segment_video, else empty list. Cache miss + no key still returns [].
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.ai.cache import clip_slug_from_name, load_cached_segments
from app.ai.segment import segment_video
from app.models import RichSOP, Segment, Source

log = logging.getLogger(__name__)


def _normalize(segments: list) -> list[dict]:
    out = []
    for item in segments:
        segment = Segment.model_validate(item)
        segment.source = Source.ai
        segment.edited = False
        out.append(segment.model_dump(mode="json"))
    return out


def get_ai_segments(
    video_path: Path,
    original_name: str,
    sop_steps: list[str] | dict[str, Any] | RichSOP,
    *,
    clip_slug: str | None = None,
    expected_absent_steps: list[int] | None = None,
) -> list[dict]:
    slug = clip_slug or clip_slug_from_name(original_name) or clip_slug_from_name(str(video_path))
    cached = load_cached_segments(slug) if slug else None
    if cached is None and original_name:
        cached = load_cached_segments(original_name)
    if cached is not None:
        return cached

    result = segment_video(
        str(video_path),
        sop_steps,
        clip_slug=slug or None,
        expected_absent_steps=expected_absent_steps,
    )
    if result.segments:
        return _normalize(result.segments)
    if result.error:
        log.warning("segment_video: %s", result.error)
    return []
