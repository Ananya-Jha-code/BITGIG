"""Seed company, experts, LSV demo gigs, tasks, and synthetic rater annotations.

Reads demo/manifest.json and demo/sops/*.json. AI timelines come from
seed/ai_cache/<clip_slug>.json (seed-fixture or a real Gemini write).
Gold is never copied into the cache.

Synthetic rater JSON (synthetic: true) is loaded so consensus has
disagreements to flag. It is not human inter-rater data.

Run from backend/:  python -m seed.load
Safe to re-run: users/gigs/tasks/annotations use fixed IDs and are upserted.
Audit events are never touched.
"""

from __future__ import annotations

import json
from pathlib import Path

from sqlmodel import Session

from app.annotation.consensus import compute_consensus
from app.ai.cache import load_cached_segments
from app.ai.fixture import write_fixture_caches
from app.ai.sop import normalize_sop, sop_lines
from app.db import engine, init_db
from app.models import (
    Anomaly,
    Annotation,
    CredentialStatus,
    DataType,
    Gig,
    GigStatus,
    Role,
    SegmentLabel,
    Task,
    TaskStatus,
    User,
    utcnow,
)

REPO_ROOT = Path(__file__).resolve().parents[1].parent
DEMO_DIR = REPO_ROOT / "demo"
MANIFEST_PATH = DEMO_DIR / "manifest.json"
RATERS_DIR = DEMO_DIR / "annotations" / "raters"

COMPANY_ID = "company-helix"
EXPERT_IDS = ["expert-priya", "expert-marcus", "expert-sofia"]
RATER_A, RATER_B = EXPERT_IDS[0], EXPERT_IDS[1]


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _users() -> list[User]:
    return [
        User(id=COMPANY_ID, name="Helix Bio Labs", role=Role.company),
        User(
            id=EXPERT_IDS[0],
            name="Dr. Priya Raman",
            role=Role.expert,
            specialty="lab_technician",
            credential_status=CredentialStatus.verified,
        ),
        User(
            id=EXPERT_IDS[1],
            name="Marcus Chen",
            role=Role.expert,
            specialty="lab_technician",
            credential_status=CredentialStatus.verified,
        ),
        User(
            id=EXPERT_IDS[2],
            name="Dr. Sofia Alvarez",
            role=Role.expert,
            specialty="lab_technician",
            credential_status=CredentialStatus.verified,
        ),
    ]


def _rater_segments(clip_slug: str, rater_id: str) -> list[dict] | None:
    path = RATERS_DIR / f"{clip_slug}__{rater_id}.json"
    if not path.exists():
        return None
    payload = _load_json(path)
    return payload.get("segments") or []


def _build_from_manifest() -> list:
    manifest = _load_json(MANIFEST_PATH)
    rows: list = _users()

    for gig_spec in manifest["gigs"]:
        sop_path = DEMO_DIR / gig_spec["sop"]
        rich = normalize_sop(_load_json(sop_path))
        sop_document = rich.model_dump(mode="json")
        steps = sop_lines(rich)

        for clip in gig_spec["clips"]:
            slug = clip["clip_slug"]
            gig_id = f"gig-{slug}"
            task_id = f"task-{slug}"
            absent = clip.get("expected_absent_steps") or []
            clip_sop = normalize_sop(sop_document, expected_absent_steps=absent)
            clip_sop_doc = clip_sop.model_dump(mode="json")
            rows.append(
                Gig(
                    id=gig_id,
                    company_id=COMPANY_ID,
                    title=f"{gig_spec['title']} ({slug})",
                    data_type=DataType.lab_video,
                    video_url=f"/demo/videos/clips/{slug}.mp4",
                    sop_steps=steps,
                    label_schema={
                        "labels": [item.value for item in SegmentLabel],
                        "anomalies": [item.value for item in Anomaly],
                        "sop": clip_sop_doc,
                        "gig_slug": gig_spec["gig_slug"],
                        "clip_slug": slug,
                        "expected_absent_steps": absent,
                    },
                    raters_required=int(gig_spec.get("raters_required") or 2),
                    required_specialty=gig_spec.get("required_specialty") or "lab_technician",
                    pay_per_task=12.0,
                    status=GigStatus.open,
                )
            )
            ai_segments = load_cached_segments(slug) or []
            segs_a = _rater_segments(slug, "expert_a")
            segs_b = _rater_segments(slug, "expert_b")
            has_pair = segs_a is not None and segs_b is not None
            status = TaskStatus.open
            if has_pair:
                _score, disagreements, _total = compute_consensus(segs_a, segs_b)
                status = TaskStatus.flagged if disagreements else TaskStatus.resolved

            rows.append(
                Task(
                    id=task_id,
                    gig_id=gig_id,
                    video_url=f"/demo/videos/clips/{slug}.mp4",
                    assigned_rater_ids=[RATER_A, RATER_B],
                    ai_segments=ai_segments,
                    status=status,
                )
            )
            submitted = utcnow()
            if segs_a is not None:
                rows.append(
                    Annotation(
                        id=f"ann-{slug}-a",
                        task_id=task_id,
                        rater_id=RATER_A,
                        segments=segs_a,
                        submitted_at=submitted,
                    )
                )
            if segs_b is not None:
                rows.append(
                    Annotation(
                        id=f"ann-{slug}-b",
                        task_id=task_id,
                        rater_id=RATER_B,
                        segments=segs_b,
                        submitted_at=submitted,
                    )
                )
    return rows


def main() -> None:
    write_fixture_caches()
    init_db()
    rows = _build_from_manifest()
    with Session(engine) as session:
        for row in rows:
            if isinstance(row, Annotation) and session.get(Annotation, row.id) is not None:
                continue
            session.merge(row)
        session.commit()
    gigs = sum(1 for row in rows if isinstance(row, Gig))
    tasks = sum(1 for row in rows if isinstance(row, Task))
    print(f"Seeded {gigs} gigs, {tasks} tasks from {MANIFEST_PATH.name}")


if __name__ == "__main__":
    main()
