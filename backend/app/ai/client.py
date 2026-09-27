"""Gemini Files API upload + generate. Imports the SDK only when called."""

from __future__ import annotations

import time
from pathlib import Path

from app.ai.config import (
    FILE_POLL_S,
    FILE_WAIT_TIMEOUT_S,
    GENERATE_TIMEOUT_S,
    MAX_VIDEO_BYTES,
    api_key,
    model_candidates,
)
from app.ai.schemas import ModelResponse


class GeminiError(Exception):
    """Upload or generate failed. Caller falls back to cache."""


def get_client():
    key = api_key()
    if not key:
        raise GeminiError("BITGIG_GEMINI_KEY is not set")
    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise GeminiError("google-genai is not installed") from exc

    http_options = None
    if hasattr(types, "HttpOptions"):
        http_options = types.HttpOptions(timeout=GENERATE_TIMEOUT_S * 1000)
    if http_options is not None:
        return genai.Client(api_key=key, http_options=http_options)
    return genai.Client(api_key=key)


def _file_state(uploaded) -> str:
    state = getattr(uploaded, "state", None)
    if state is None:
        return "UNKNOWN"
    return getattr(state, "name", str(state)).upper()


def upload_video(path: Path):
    size = path.stat().st_size
    if size > MAX_VIDEO_BYTES:
        raise GeminiError(
            f"Video is {size} bytes; max for this demo path is {MAX_VIDEO_BYTES}. "
            "Transcode to 720p 15 fps (see demo/scripts/make_clips.py)."
        )
    client = get_client()
    uploaded = client.files.upload(file=path)
    deadline = time.time() + FILE_WAIT_TIMEOUT_S
    while _file_state(uploaded) in {"PROCESSING", "STATE_UNSPECIFIED", "UNKNOWN"}:
        if time.time() > deadline:
            raise GeminiError("Timed out waiting for Gemini Files API to process the video")
        time.sleep(FILE_POLL_S)
        uploaded = client.files.get(name=uploaded.name)
    if _file_state(uploaded) != "ACTIVE":
        raise GeminiError(f"Gemini file state is {_file_state(uploaded)}")
    return uploaded


def _is_capacity_or_missing(exc: Exception) -> bool:
    text = str(exc)
    return any(token in text for token in ("503", "UNAVAILABLE", "404", "NOT_FOUND", "high demand"))


def generate_segments(uploaded, user_prompt: str, system_prompt: str) -> tuple[ModelResponse, bool, str]:
    """Returns (parsed, repaired, model). repaired=True if a later attempt succeeded."""
    from google.genai import types

    client = get_client()
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        response_mime_type="application/json",
        response_schema=ModelResponse,
    )
    last_error: Exception | None = None
    repaired = False
    for model in model_candidates():
        for attempt in (1, 2):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=[uploaded, user_prompt],
                    config=config,
                )
                text = getattr(response, "text", None) or ""
                return ModelResponse.model_validate_json(text), repaired, model
            except Exception as exc:
                last_error = exc
                repaired = True
                if _is_capacity_or_missing(exc):
                    break
                if attempt == 2:
                    break
    raise GeminiError(f"Gemini structured output failed: {last_error}") from last_error
