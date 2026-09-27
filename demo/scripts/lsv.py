"""Shared helpers for turning LSV metadata into BitGig segments."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Iterator

DEMO_DIR = Path(__file__).resolve().parent.parent
MANIFEST_PATH = DEMO_DIR / "manifest.json"
RAW_DIR = DEMO_DIR / "videos" / "raw"
CLIPS_DIR = DEMO_DIR / "videos" / "clips"
GOLD_DIR = DEMO_DIR / "annotations" / "gold"
RATERS_DIR = DEMO_DIR / "annotations" / "raters"

# A missed step has no real duration, but a zero-width segment makes temporal IoU
# divide by zero in consensus matching. Give markers a small nonzero width instead.
MISSED_STEP_MARKER_S = 0.4

# "s1-0'17''", "s6s7-1'02''", "6-0'37''", "s5-skip", "s4-0'39 ''"
_TOKEN = re.compile(r"^s?(?P<steps>\d+(?:s\d+)*)\s*-\s*(?P<value>.+)$", re.IGNORECASE)
_CLOCK_APOS = re.compile(r"^(?P<m>\d+)'\s*(?:(?P<s>\d+)\s*'')?\s*$")
_CLOCK_COLON = re.compile(r"^(?P<m>\d+):(?P<s>\d+(?:\.\d+)?)$")


def load_manifest() -> dict[str, Any]:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def load_sop(relative_path: str) -> dict[str, Any]:
    return json.loads((DEMO_DIR / relative_path).read_text(encoding="utf-8"))


def iter_clips(manifest: dict[str, Any], include_broll: bool = False) -> Iterator[tuple[dict, dict]]:
    """Yield (gig, clip) pairs. B-roll clips are yielded with a synthetic gig stub."""
    for gig in manifest["gigs"]:
        for clip in gig["clips"]:
            yield gig, clip
    if include_broll:
        for clip in manifest.get("broll", []):
            yield {"gig_slug": "broll", "sop": None, "clips": []}, clip


def parse_clock(raw: str) -> float | None:
    """Parse LSV time strings into seconds. Returns None for 'skip' or unparseable values."""
    text = raw.strip()
    if not text or text.lower() in {"skip", "none", "n/a"}:
        return None
    match = _CLOCK_APOS.match(text)
    if match:
        return int(match.group("m")) * 60 + int(match.group("s") or 0)
    match = _CLOCK_COLON.match(text)
    if match:
        return int(match.group("m")) * 60 + float(match.group("s"))
    return None


def parse_timestamps(raw: str) -> tuple[dict[int, float], set[int]]:
    """Parse the LSV Time_stamp column.

    Returns ({sop_step: start_seconds}, {sop_step marked 'skip'}), both 0-based.
    LSV writes 1-based step ids (s1..sN), so every index is shifted down by one.
    A step id may appear more than once ("s10-8'53'';s10-12'50''"); the earliest wins.
    """
    starts: dict[int, float] = {}
    skipped: set[int] = set()
    for token in (raw or "").split(";"):
        token = token.strip()
        if not token:
            continue
        match = _TOKEN.match(token)
        if not match:
            continue
        step_ids = [int(part) - 1 for part in re.split(r"s", match.group("steps"), flags=re.IGNORECASE) if part]
        seconds = parse_clock(match.group("value"))
        for step in step_ids:
            if seconds is None:
                skipped.add(step)
            elif step not in starts or seconds < starts[step]:
                starts[step] = seconds
    return starts, skipped


def build_segments(clip: dict[str, Any], sop: dict[str, Any]) -> list[dict[str, Any]]:
    """Convert one manifest clip plus its SOP into a list of Segment dicts.

    LSV records only the start of each step, so each segment ends where the next
    visible step begins and the final segment ends at the clip duration.
    """
    starts, _skipped = parse_timestamps(clip.get("lsv_timestamps", ""))
    if not starts:
        return []

    steps_by_index = {step["index"]: step for step in sop["steps"]}
    findings = {finding["sop_step"]: finding for finding in clip.get("step_findings", [])}
    duration = float(clip["duration_s"])

    ordered = sorted(starts.items(), key=lambda item: (item[1], item[0]))
    segments: list[dict[str, Any]] = []
    for position, (step_index, start) in enumerate(ordered):
        end = ordered[position + 1][1] if position + 1 < len(ordered) else duration
        if end <= start:
            end = min(start + 1.0, duration)
        finding = findings.get(step_index, {})
        step = steps_by_index.get(step_index, {})
        segments.append(
            {
                "start": round(float(start), 2),
                "end": round(float(end), 2),
                "label": finding.get("label") or step.get("default_label", "other"),
                "sop_step": step_index,
                "success": bool(finding.get("success", True)),
                "anomaly": finding.get("anomaly"),
                "source": "human",
                "edited": False,
            }
        )

    # Steps the operator never performed have no timestamp, so they need an explicit
    # zero-width marker at the point the omission became apparent.
    for step_index, finding in sorted(findings.items()):
        if step_index in starts or finding.get("anomaly") != "missed_step":
            continue
        anchor = _omission_anchor(step_index, ordered, duration)
        segments.append(
            {
                "start": round(anchor, 2),
                "end": round(min(anchor + MISSED_STEP_MARKER_S, duration), 2),
                "label": steps_by_index.get(step_index, {}).get("default_label", "other"),
                "sop_step": step_index,
                "success": False,
                "anomaly": "missed_step",
                "source": "human",
                "edited": False,
            }
        )

    segments.sort(key=lambda segment: (segment["start"], segment["sop_step"]))
    return segments


def _omission_anchor(step_index: int, ordered: list[tuple[int, float]], duration: float) -> float:
    """Place a missed step just after the last step that did happen before it."""
    previous = [start for step, start in ordered if step < step_index]
    if previous:
        return min(max(previous) + 0.5, duration)
    return ordered[0][1] if ordered else 0.0
