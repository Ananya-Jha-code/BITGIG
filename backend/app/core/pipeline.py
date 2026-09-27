"""Gets AI segments for a new gig's video.

Order: Person 4's live `segment_video` if it exists and succeeds, else the
cached result in seed/ai_cache/, else no segments. The demo must never
depend on a live API call working.
"""

import json
import logging
from pathlib import Path

from app.models import Segment, Source

try:
    from app.ai import segment_video
except ImportError:  # AI pipeline not built yet
    segment_video = None

AI_CACHE_DIR = Path(__file__).resolve().parents[2] / "seed" / "ai_cache"

log = logging.getLogger(__name__)


def _normalize(segments: list) -> list[dict]:
    out = []
    for s in segments:
        seg = Segment.model_validate(s)
        seg.source = Source.ai
        seg.edited = False
        out.append(seg.model_dump(mode="json"))
    return out


def load_cached_segments(video_name: str) -> list[dict] | None:
    """Cached segments for a video, looked up by file stem. None if not cached."""
    path = AI_CACHE_DIR / f"{Path(video_name).stem}.json"
    if not path.exists():
        return None
    return _normalize(json.loads(path.read_text()))


def get_ai_segments(video_path: Path, original_name: str, sop_steps: list[str]) -> list[dict]:
    if segment_video is not None:
        try:
            return _normalize(segment_video(str(video_path), sop_steps))
        except Exception:
            log.exception("segment_video failed; falling back to cache")
    cached = load_cached_segments(original_name)
    if cached is None:
        log.warning("No AI segments for %s (no live AI, no cache)", original_name)
        return []
    return cached
