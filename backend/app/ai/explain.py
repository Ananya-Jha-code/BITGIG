"""Explain a rater-vs-rater disagreement. Gemini if keyed; else a local sentence."""

from __future__ import annotations

from typing import Any

from app.annotation.consensus import compare_pair
from app.ai.client import GeminiError, get_client
from app.ai.config import PROMPTS_DIR, api_key, model_name
from app.ai.sop import normalize_sop, sop_lines


def _local_explanation(
    segment_a: dict[str, Any] | None,
    segment_b: dict[str, Any] | None,
    reasons: list[str],
) -> str:
    if segment_a is None and segment_b is None:
        return "No segments to compare."
    if segment_a is None:
        start = segment_b.get("start")  # type: ignore[union-attr]
        end = segment_b.get("end")
        return (
            f"Only rater B has a segment {start}-{end}s "
            f"({segment_b.get('label')}, sop_step={segment_b.get('sop_step')})."
        )
    if segment_b is None:
        start = segment_a.get("start")
        end = segment_a.get("end")
        return (
            f"Only rater A has a segment {start}-{end}s "
            f"({segment_a.get('label')}, sop_step={segment_a.get('sop_step')})."
        )
    start = min(segment_a["start"], segment_b["start"])
    end = max(segment_a["end"], segment_b["end"])
    reason_text = ", ".join(reasons) if reasons else "unspecified mismatch"
    return (
        f"Raters disagree on {start}-{end}s ({reason_text}). "
        f"A: label={segment_a.get('label')} anomaly={segment_a.get('anomaly')}. "
        f"B: label={segment_b.get('label')} anomaly={segment_b.get('anomaly')}."
    )


def explain_disagreement(
    annotation_a: dict[str, Any] | None,
    annotation_b: dict[str, Any] | None,
    sop_steps: list[str] | dict[str, Any] | None,
) -> str:
    reasons: list[str] = []
    if annotation_a and annotation_b:
        reasons = compare_pair(annotation_a, annotation_b)
    elif annotation_a or annotation_b:
        reasons = ["unmatched_segment"]

    fallback = _local_explanation(annotation_a, annotation_b, reasons)
    if not api_key():
        return fallback

    try:
        from google.genai import types
    except ImportError:
        return fallback

    rich = normalize_sop(sop_steps if not isinstance(sop_steps, list) else sop_steps)
    sop_text = "\n".join(f"{i}. {line}" for i, line in enumerate(sop_lines(rich) or (sop_steps or [])))
    system = (PROMPTS_DIR / "explain_disagreement.txt").read_text(encoding="utf-8")
    user = (
        f"SOP steps:\n{sop_text or '(none)'}\n\n"
        f"Rater A segment: {annotation_a}\n"
        f"Rater B segment: {annotation_b}\n"
        f"Flag reasons: {reasons}"
    )
    try:
        client = get_client()
        response = client.models.generate_content(
            model=model_name(),
            contents=user,
            config=types.GenerateContentConfig(system_instruction=system),
        )
        text = (getattr(response, "text", None) or "").strip()
        return text or fallback
    except (GeminiError, Exception):
        return fallback
