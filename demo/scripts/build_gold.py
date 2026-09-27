"""Generate gold annotations and two rater variants from demo/manifest.json.

Gold segments come from LSV's own step timestamps plus the hand-authored
step_findings in the manifest. The two rater files are gold with documented
perturbations applied, so consensus review has guaranteed flags in the demo.

    python demo/scripts/build_gold.py
    python demo/scripts/build_gold.py --check
"""

from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path
from typing import Any

from lsv import DEMO_DIR, GOLD_DIR, RATERS_DIR, build_segments, iter_clips, load_manifest, load_sop

LABELS = {"aspirate", "dispense", "transfer", "other"}
ANOMALIES = {None, "spill", "contamination", "misalignment", "missed_step"}

# Expert A stays inside every consensus threshold, so gold vs A produces no flags.
RATER_A_START_SHIFT = 0.3
# Expert B breaks one consensus rule per perturbation. Keep these in sync with the
# thresholds in backend/app/annotation (temporal IoU >= 0.5, boundary delta <= 1.0s).
RATER_B_BOUNDARY_SHIFT = 2.4


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def validate(segments: list[dict[str, Any]], duration: float, where: str) -> list[str]:
    problems = []
    for index, segment in enumerate(segments):
        if segment["label"] not in LABELS:
            problems.append(f"{where}[{index}]: bad label {segment['label']!r}")
        if segment["anomaly"] not in ANOMALIES:
            problems.append(f"{where}[{index}]: bad anomaly {segment['anomaly']!r}")
        if segment["start"] > segment["end"]:
            problems.append(f"{where}[{index}]: start after end")
        if segment["end"] > duration + 0.01:
            problems.append(f"{where}[{index}]: end {segment['end']} past duration {duration}")
    return problems


def make_rater_a(segments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    variant = copy.deepcopy(segments)
    for segment in variant:
        if segment["end"] - segment["start"] > 2 * RATER_A_START_SHIFT:
            segment["start"] = round(segment["start"] + RATER_A_START_SHIFT, 2)
    return variant


def make_rater_b(segments: list[dict[str, Any]], duration: float) -> tuple[list[dict[str, Any]], list[str]]:
    """Apply one perturbation per consensus flag rule and report what was planted."""
    variant = copy.deepcopy(segments)
    planted: list[str] = []

    for segment in variant:
        if segment["end"] - segment["start"] > RATER_B_BOUNDARY_SHIFT + 1:
            segment["start"] = round(segment["start"] + RATER_B_BOUNDARY_SHIFT, 2)
            planted.append(f"boundary shift of {RATER_B_BOUNDARY_SHIFT}s on sop_step {segment['sop_step']}")
            break

    for segment in variant:
        if segment["label"] == "transfer":
            segment["label"] = "dispense"
            planted.append(f"label transfer -> dispense on sop_step {segment['sop_step']}")
            break

    for segment in variant:
        if segment["anomaly"] is not None:
            planted.append(f"anomaly {segment['anomaly']!r} dropped on sop_step {segment['sop_step']}")
            segment["anomaly"] = None
            segment["success"] = True
            break
    else:
        if variant:
            variant[0]["anomaly"] = "spill"
            variant[0]["success"] = False
            planted.append(f"spurious spill added on sop_step {variant[0]['sop_step']}")

    if len(variant) > 2:
        dropped = variant.pop()
        planted.append(f"segment for sop_step {dropped['sop_step']} omitted entirely")

    return variant, planted


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="validate only, write nothing")
    args = parser.parse_args()

    manifest = load_manifest()
    sop_cache: dict[str, dict[str, Any]] = {}
    problems: list[str] = []
    written = 0

    for gig, clip in iter_clips(manifest):
        sop_path = gig["sop"]
        sop = sop_cache.setdefault(sop_path, load_sop(sop_path))
        duration = float(clip["duration_s"])
        segments = build_segments(clip, sop)
        if not segments:
            problems.append(f"{clip['slice_id']}: no parseable timestamps")
            continue

        problems += validate(segments, duration, f"{clip['clip_slug']} gold")
        rater_a = make_rater_a(segments)
        rater_b, planted = make_rater_b(segments, duration)

        absent = clip.get("expected_absent_steps", [])
        gold = {
            "clip_slug": clip["clip_slug"],
            "video": f"videos/clips/{clip['clip_slug']}.mp4",
            "gig_slug": gig["gig_slug"],
            "sop_id": sop["sop_id"],
            "duration_s": duration,
            "source": {
                "dataset": "YinkaiW/LSV",
                "slice_id": clip["slice_id"],
                "source_file": clip["source_file"],
                "license": "CC BY-NC 4.0",
                "lsv_issue": clip.get("lsv_issue"),
            },
            "expected_absent_steps": absent,
            "segments": segments,
        }

        print(f"{clip['slice_id']:<9} {clip['clip_slug']:<32} {len(segments)} segments")
        for note in planted:
            print(f"            planted: {note}")

        if args.check:
            continue

        write_json(GOLD_DIR / f"{clip['clip_slug']}.json", gold)
        for rater_id, rater_segments, note in (
            ("expert_a", rater_a, f"gold with every start shifted +{RATER_A_START_SHIFT}s; expected to agree"),
            ("expert_b", rater_b, "gold with planted disagreements; expected to flag"),
        ):
            write_json(
                RATERS_DIR / f"{clip['clip_slug']}__{rater_id}.json",
                {
                    "clip_slug": clip["clip_slug"],
                    "rater_id": rater_id,
                    "synthetic": True,
                    "derived_from": f"annotations/gold/{clip['clip_slug']}.json",
                    "perturbation_note": note,
                    "planted_disagreements": planted if rater_id == "expert_b" else [],
                    "segments": rater_segments,
                },
            )
        written += 1

    if problems:
        print("\nProblems:")
        for problem in problems:
            print(f"  {problem}")

    if not args.check:
        print(f"\n{written} clip(s) written to {GOLD_DIR.relative_to(DEMO_DIR.parent)}")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
