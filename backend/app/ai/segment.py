"""segment_video: Gemini Files API pre-annotation. Never raises into FastAPI."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from app.ai.cache import clip_slug_from_name, now_iso, write_cache
from app.ai.client import GeminiError, generate_segments, upload_video
from app.ai.config import (
    CONFIDENCE_REVIEW_THRESHOLD,
    DEMO_DIR,
    PROMPT_VERSION,
    PROMPTS_DIR,
    api_key,
    model_name,
)
from app.ai.schemas import AiAnnotateResult, CacheEnvelope, ModelSegment
from app.ai.sop import format_sop_for_prompt, normalize_sop
from app.models import RichSOP, Segment, Source


def _load_prompt() -> str:
    return (PROMPTS_DIR / "segment_video.txt").read_text(encoding="utf-8")


def _resolve_video(video_uri: str) -> Path | None:
    path = Path(video_uri)
    if path.is_file():
        return path
    if video_uri.startswith("/demo/"):
        candidate = DEMO_DIR / video_uri.removeprefix("/demo/")
        if candidate.is_file():
            return candidate
    under_demo = DEMO_DIR / video_uri
    if under_demo.is_file():
        return under_demo
    return None


def _to_segments(raw: list[ModelSegment], *, repaired: bool) -> tuple[list[Segment], bool]:
    needs_review = repaired
    out: list[Segment] = []
    for item in raw:
        confidence = item.confidence
        if confidence is not None and confidence < CONFIDENCE_REVIEW_THRESHOLD:
            needs_review = True
        out.append(
            Segment(
                start=item.start,
                end=item.end,
                label=item.label,
                sop_step=item.sop_step,
                success=item.success,
                anomaly=item.anomaly,
                source=Source.ai,
                edited=False,
                confidence=confidence,
            )
        )
    return out, needs_review


def _empty_result(
    *,
    clip_slug: str | None,
    video: str | None,
    error: str,
    needs_review: bool = True,
) -> AiAnnotateResult:
    return AiAnnotateResult(
        clip_slug=clip_slug,
        video=video,
        model=model_name(),
        prompt_version=PROMPT_VERSION,
        created_at=now_iso(),
        needs_review=needs_review,
        segments=[],
        error=error,
    )


def segment_video(
    video_uri: str,
    sop: RichSOP | list[str] | dict[str, Any],
    *,
    clip_slug: str | None = None,
    expected_absent_steps: list[int] | None = None,
    persist_cache: bool = True,
) -> AiAnnotateResult:
    """Pre-annotate a clip. On missing key or API failure, return empty + error."""
    slug = clip_slug or clip_slug_from_name(video_uri)
    rich = normalize_sop(sop, expected_absent_steps=expected_absent_steps)

    if not api_key():
        return _empty_result(
            clip_slug=slug,
            video=video_uri,
            error="BITGIG_GEMINI_KEY is not set",
        )

    path = _resolve_video(video_uri)
    if path is None:
        return _empty_result(
            clip_slug=slug,
            video=video_uri,
            error=f"Video not found: {video_uri}",
        )

    user_prompt = (
        f"clip_slug: {slug or path.stem}\n"
        f"video_file: {path.name}\n\n"
        f"{format_sop_for_prompt(rich)}"
    )

    try:
        uploaded = upload_video(path)
        parsed, repaired, used_model = generate_segments(uploaded, user_prompt, _load_prompt())
        segments, needs_review = _to_segments(parsed.segments, repaired=repaired)
        result = AiAnnotateResult(
            clip_slug=slug,
            video=f"videos/clips/{slug}.mp4" if slug else path.name,
            model=used_model,
            prompt_version=PROMPT_VERSION,
            created_at=now_iso(),
            needs_review=needs_review,
            segments=segments,
            raw={"segment_count": len(segments), "repaired": repaired},
        )
        if persist_cache and slug:
            write_cache(
                CacheEnvelope(
                    clip_slug=slug,
                    video=result.video or path.name,
                    model=result.model,
                    prompt_version=result.prompt_version,
                    created_at=result.created_at,
                    needs_review=result.needs_review,
                    segments=result.segments,
                )
            )
        return result
    except GeminiError as exc:
        return _empty_result(clip_slug=slug, video=video_uri, error=str(exc))
    except Exception as exc:
        return _empty_result(clip_slug=slug, video=video_uri, error=str(exc))
