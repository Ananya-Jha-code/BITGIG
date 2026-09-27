"""Read/write backend/seed/ai_cache/<clip_slug>.json. Accepts old bare arrays."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.ai.config import CACHE_DIR
from app.ai.schemas import CacheEnvelope
from app.models import Segment, Source

_UPLOAD_PREFIX = re.compile(r"^[0-9a-f]{8}_", re.IGNORECASE)


def clip_slug_from_name(name: str | None) -> str:
    """File stem, minus the 8-hex upload prefix from save_upload."""
    stem = Path(name or "").stem
    return _UPLOAD_PREFIX.sub("", stem)


def cache_path(clip_slug: str) -> Path:
    return CACHE_DIR / f"{clip_slug}.json"


def _normalize_segments(raw: list[Any]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for item in raw:
        segment = Segment.model_validate(item)
        segment.source = Source.ai
        segment.edited = False
        out.append(segment.model_dump(mode="json"))
    return out


def parse_cache_payload(payload: Any) -> list[dict[str, Any]] | None:
    """Bare array (legacy) or {segments: [...]} envelope."""
    if payload is None:
        return None
    if isinstance(payload, list):
        return _normalize_segments(payload)
    if isinstance(payload, dict) and "segments" in payload:
        return _normalize_segments(payload["segments"])
    return None


def load_cached_envelope(clip_slug: str) -> dict[str, Any] | None:
    path = cache_path(clip_slug)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def load_cached_segments(video_name: str) -> list[dict[str, Any]] | None:
    """Lookup by clip_slug, then by raw stem (legacy pipetting_demo.json)."""
    slug = clip_slug_from_name(video_name)
    for key in (slug, Path(video_name).stem, video_name):
        if not key:
            continue
        path = cache_path(key)
        if not path.exists():
            continue
        parsed = parse_cache_payload(json.loads(path.read_text(encoding="utf-8")))
        if parsed is not None:
            return parsed
    return None


def write_cache(envelope: CacheEnvelope | dict[str, Any]) -> Path:
    if isinstance(envelope, dict):
        envelope = CacheEnvelope.model_validate(envelope)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = cache_path(envelope.clip_slug)
    path.write_text(envelope.model_dump_json(indent=2) + "\n", encoding="utf-8")
    return path


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
