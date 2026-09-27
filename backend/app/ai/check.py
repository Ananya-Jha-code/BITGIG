"""Flag AI pre-annotation vs a specialist's segments using the same IoU rules."""

from __future__ import annotations

from typing import Any

from app.annotation.consensus import compute_consensus
from app.ai.schemas import Issue


def check_annotation(
    ai_segments: list[dict[str, Any]] | None,
    human_segments: list[dict[str, Any]] | None,
) -> list[Issue]:
    """Disagreements between the Gemini timeline and one human timeline."""
    score_ignored, disagreements, _total = compute_consensus(
        list(ai_segments or []),
        list(human_segments or []),
    )
    del score_ignored
    return [
        Issue(
            reasons=item["reasons"],
            ai_segment=item.get("segment_a"),
            human_segment=item.get("segment_b"),
        )
        for item in disagreements
    ]
