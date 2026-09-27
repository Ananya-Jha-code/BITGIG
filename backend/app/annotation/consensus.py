"""Consensus between two raters' segments. Pure functions, no DB.

Segments are plain dicts shaped like app.models.Segment (as stored in JSONB).
"""

from typing import Any

# Thresholds (see CLAUDE.md "Consensus logic"). Tune here.
IOU_MATCH_THRESHOLD = 0.5  # two segments match if temporal IoU >= this
BOUNDARY_TOLERANCE_S = 1.0  # start/end may differ by at most this many seconds

# Disagreement reasons.
REASON_LABEL = "label_mismatch"
REASON_SOP_STEP = "sop_step_mismatch"
REASON_SUCCESS = "success_mismatch"
REASON_BOUNDARY = "boundary_mismatch"
REASON_ANOMALY = "anomaly_mismatch"
REASON_UNMATCHED = "unmatched_segment"

SegmentDict = dict[str, Any]


def temporal_iou(a: SegmentDict, b: SegmentDict) -> float:
    """Overlap / union of the two time intervals (0.0 if they don't overlap)."""
    overlap = min(a["end"], b["end"]) - max(a["start"], b["start"])
    if overlap <= 0:
        return 0.0
    union = max(a["end"], b["end"]) - min(a["start"], b["start"])
    return overlap / union if union > 0 else 0.0


def match_segments(
    segments_a: list[SegmentDict], segments_b: list[SegmentDict]
) -> tuple[list[tuple[int, int]], list[int], list[int]]:
    """Greedy one-to-one matching by best IoU.

    Returns (matched index pairs (i_a, i_b), unmatched indexes in A, unmatched indexes in B).
    """
    candidates: list[tuple[float, int, int]] = []
    for i, seg_a in enumerate(segments_a):
        for j, seg_b in enumerate(segments_b):
            iou = temporal_iou(seg_a, seg_b)
            if iou >= IOU_MATCH_THRESHOLD:
                candidates.append((iou, i, j))
    candidates.sort(key=lambda c: c[0], reverse=True)

    used_a: set[int] = set()
    used_b: set[int] = set()
    pairs: list[tuple[int, int]] = []
    for _, i, j in candidates:
        if i in used_a or j in used_b:
            continue
        pairs.append((i, j))
        used_a.add(i)
        used_b.add(j)

    pairs.sort()
    unmatched_a = [i for i in range(len(segments_a)) if i not in used_a]
    unmatched_b = [j for j in range(len(segments_b)) if j not in used_b]
    return pairs, unmatched_a, unmatched_b


def compare_pair(a: SegmentDict, b: SegmentDict) -> list[str]:
    """Reasons a matched pair disagrees (empty list = they agree)."""
    reasons: list[str] = []
    if a.get("label") != b.get("label"):
        reasons.append(REASON_LABEL)
    if a.get("sop_step") != b.get("sop_step"):
        reasons.append(REASON_SOP_STEP)
    if a.get("success") != b.get("success"):
        reasons.append(REASON_SUCCESS)
    if (
        abs(a["start"] - b["start"]) > BOUNDARY_TOLERANCE_S
        or abs(a["end"] - b["end"]) > BOUNDARY_TOLERANCE_S
    ):
        reasons.append(REASON_BOUNDARY)
    if (a.get("anomaly") is None) != (b.get("anomaly") is None):
        reasons.append(REASON_ANOMALY)
    return reasons


def compute_consensus(
    segments_a: list[SegmentDict], segments_b: list[SegmentDict]
) -> tuple[float, list[dict[str, Any]], int]:
    """Compare rater A and rater B.

    Returns (agreement_score, disagreements, total_unique_segments).
    Each disagreement: {"reasons": [...], "segment_a": dict | None, "segment_b": dict | None}.
    Agreement score = matched pairs with no flags / total unique segments
    (a matched pair counts once; each unmatched segment counts once). 1.0 if both are empty.
    """
    pairs, unmatched_a, unmatched_b = match_segments(segments_a, segments_b)

    disagreements: list[dict[str, Any]] = []
    agreed = 0
    for i, j in pairs:
        reasons = compare_pair(segments_a[i], segments_b[j])
        if reasons:
            disagreements.append(
                {"reasons": reasons, "segment_a": segments_a[i], "segment_b": segments_b[j]}
            )
        else:
            agreed += 1
    for i in unmatched_a:
        disagreements.append(
            {"reasons": [REASON_UNMATCHED], "segment_a": segments_a[i], "segment_b": None}
        )
    for j in unmatched_b:
        disagreements.append(
            {"reasons": [REASON_UNMATCHED], "segment_a": None, "segment_b": segments_b[j]}
        )

    # Keep disagreements in video order for the UI.
    disagreements.sort(key=lambda d: (d["segment_a"] or d["segment_b"])["start"])

    total = len(pairs) + len(unmatched_a) + len(unmatched_b)
    score = agreed / total if total > 0 else 1.0
    return score, disagreements, total
