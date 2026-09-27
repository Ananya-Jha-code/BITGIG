"""Normalize list[str] SOP lines and demo/sops/*.json into RichSOP."""

from __future__ import annotations

from typing import Any

from app.models import RichSOP, SegmentLabel, SopStep


def sop_from_lines(steps: list[str], *, sop_id: str = "inline") -> RichSOP:
    return RichSOP(
        sop_id=sop_id,
        title="",
        steps=[
            SopStep(index=index, text=text, default_label=SegmentLabel.other)
            for index, text in enumerate(steps)
        ],
    )


def normalize_sop(
    sop: RichSOP | dict[str, Any] | list[str] | None,
    *,
    expected_absent_steps: list[int] | None = None,
) -> RichSOP:
    if sop is None:
        rich = sop_from_lines([])
    elif isinstance(sop, RichSOP):
        rich = sop
    elif isinstance(sop, list):
        rich = sop_from_lines([str(item) for item in sop])
    elif isinstance(sop, dict):
        rich = RichSOP.model_validate(sop)
    else:
        raise TypeError(f"Unsupported SOP type: {type(sop)!r}")

    absent = list(rich.expected_absent_steps)
    if expected_absent_steps:
        absent = sorted(set(absent) | set(expected_absent_steps))
    for step in rich.steps:
        if step.usually_absent_from_recording and step.index not in absent:
            absent.append(step.index)
    rich.expected_absent_steps = sorted(set(absent))
    return rich


def sop_lines(rich: RichSOP) -> list[str]:
    return [step.text for step in sorted(rich.steps, key=lambda item: item.index)]


def format_sop_for_prompt(rich: RichSOP) -> str:
    lines = [
        f"SOP id: {rich.sop_id}",
        f"Title: {rich.title or '(none)'}",
        f"expected_absent_steps (do not mark missed_step): {rich.expected_absent_steps or '[]'}",
        "Steps (0-based index):",
    ]
    for step in sorted(rich.steps, key=lambda item: item.index):
        extra = []
        if step.usually_absent_from_recording:
            extra.append("usually_absent_from_recording")
        if step.absence_note:
            extra.append(step.absence_note)
        suffix = f" [{'; '.join(extra)}]" if extra else ""
        lines.append(
            f"  {step.index}. [{step.default_label.value}] {step.text}{suffix}"
        )
    return "\n".join(lines)
