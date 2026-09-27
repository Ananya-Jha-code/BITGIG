"""Single place for Gemini model name, timeouts, and prompt version."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Default only lives here. Override with GEMINI_MODEL in the environment.
# 2.5-flash 404s for new keys; 3.8/3.7-flash 503 on video structured output.
DEFAULT_MODEL = "gemini-3.1-flash-lite"
FALLBACK_MODELS = (
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-latest",
)
PROMPT_VERSION = "v1"
FIXTURE_MODEL = "seed-fixture"
FIXTURE_PROMPT_VERSION = "fixture-v1"

CONFIDENCE_REVIEW_THRESHOLD = 0.6
GENERATE_TIMEOUT_S = 120
FILE_WAIT_TIMEOUT_S = 180
FILE_POLL_S = 2.0
# Demo clips are already 720p / 15 fps / no audio so they stay under this.
MAX_VIDEO_BYTES = 20 * 1024 * 1024

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
CACHE_DIR = Path(__file__).resolve().parents[2] / "seed" / "ai_cache"
REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_DIR = REPO_ROOT / "demo"


def api_key() -> str | None:
    key = os.getenv("BITGIG_GEMINI_KEY")
    if key is None:
        return None
    key = key.strip()
    return key or None


def model_name() -> str:
    return (os.getenv("GEMINI_MODEL") or "").strip() or DEFAULT_MODEL


def model_candidates() -> list[str]:
    primary = model_name()
    out: list[str] = [primary]
    for name in FALLBACK_MODELS:
        if name not in out:
            out.append(name)
    return out
