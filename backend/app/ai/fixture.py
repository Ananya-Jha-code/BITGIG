"""Build seed-fixture cache from LSV clocks + SOP default_label.

This is not gold and not a Gemini transcript. Gold judgments (success/anomaly)
stay in demo/annotations/gold/. Fixtures only give a timeline to correct.
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
from typing import Any

from app.ai.cache import now_iso, write_cache
from app.ai.config import DEMO_DIR, FIXTURE_MODEL, FIXTURE_PROMPT_VERSION
from app.ai.schemas import CacheEnvelope
from app.models import Segment, Source


def _lsv():
    path = DEMO_DIR / "scripts" / "lsv.py"
    spec = importlib.util.spec_from_file_location("demo_lsv", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _preannotate(clip: dict[str, Any], sop: dict[str, Any]) -> list[Segment]:
    lsv = _lsv()
    clock_only = {**clip, "step_findings": []}
    raw = lsv.build_segments(clock_only, sop)
    segments: list[Segment] = []
    for item in raw:
        item = dict(item)
        item["source"] = Source.ai
        item["edited"] = False
        item["success"] = True
        item["anomaly"] = None
        item["confidence"] = None
        segments.append(Segment.model_validate(item))
    return segments


def write_fixture_caches() -> list[Path]:
    lsv = _lsv()
    manifest = json.loads((DEMO_DIR / "manifest.json").read_text(encoding="utf-8"))
    written: list[Path] = []
    created = now_iso()
    for gig, clip in lsv.iter_clips(manifest):
        sop = json.loads((DEMO_DIR / gig["sop"]).read_text(encoding="utf-8"))
        slug = clip["clip_slug"]
        segments = _preannotate(clip, sop)
        if not segments:
            continue
        path = write_cache(
            CacheEnvelope(
                clip_slug=slug,
                video=f"videos/clips/{slug}.mp4",
                model=FIXTURE_MODEL,
                prompt_version=FIXTURE_PROMPT_VERSION,
                created_at=created,
                needs_review=True,
                segments=segments,
            )
        )
        written.append(path)
    return written


def main() -> None:
    paths = write_fixture_caches()
    print(f"Wrote {len(paths)} seed-fixture cache files (not gold, not Gemini)")


if __name__ == "__main__":
    main()
