"""Seed demo data: one company, three experts, one lab video gig, one task.

Run from backend/:  python -m seed.load
Safe to re-run: rows use fixed IDs and are upserted. Annotations and audit
events are never touched (audit log is append-only).
"""

from sqlmodel import Session

from app.core.pipeline import load_cached_segments
from app.db import engine, init_db
from app.models import (
    Anomaly,
    CredentialStatus,
    DataType,
    Gig,
    GigStatus,
    Role,
    SegmentLabel,
    Task,
    TaskStatus,
    User,
)

DEMO_VIDEO = "pipetting_demo.mp4"

COMPANY_ID = "company-helix"
EXPERT_IDS = ["expert-priya", "expert-marcus", "expert-sofia"]
GIG_ID = "gig-pcr-prep"
TASK_ID = "task-pcr-prep-1"

SOP_STEPS = [
    "Aspirate 10 uL master mix from the reservoir",
    "Dispense master mix into well A1",
    "Aspirate 5 uL sample from tube 1",
    "Dispense sample into well A1 and mix by pipetting",
    "Transfer the plate to the thermocycler",
]


def build_rows() -> list:
    company = User(id=COMPANY_ID, name="Helix Bio Labs", role=Role.company)
    experts = [
        User(id=EXPERT_IDS[0], name="Dr. Priya Raman", role=Role.expert,
             specialty="lab_technician", credential_status=CredentialStatus.verified),
        User(id=EXPERT_IDS[1], name="Marcus Chen", role=Role.expert,
             specialty="lab_technician", credential_status=CredentialStatus.verified),
        # Third expert acts as adjudicator when the first two disagree.
        User(id=EXPERT_IDS[2], name="Dr. Sofia Alvarez", role=Role.expert,
             specialty="lab_technician", credential_status=CredentialStatus.verified),
    ]
    gig = Gig(
        id=GIG_ID,
        company_id=COMPANY_ID,
        title="PCR plate prep: pipetting step verification",
        data_type=DataType.lab_video,
        video_url=f"/demo/videos/{DEMO_VIDEO}",
        sop_steps=SOP_STEPS,
        label_schema={
            "labels": [l.value for l in SegmentLabel],
            "anomalies": [a.value for a in Anomaly],
        },
        raters_required=2,
        required_specialty="lab_technician",
        pay_per_task=12.0,
        status=GigStatus.open,
    )
    task = Task(
        id=TASK_ID,
        gig_id=GIG_ID,
        assigned_rater_ids=EXPERT_IDS[:2],
        ai_segments=load_cached_segments(DEMO_VIDEO) or [],
        status=TaskStatus.open,
    )
    return [company, *experts, gig, task]


def main() -> None:
    init_db()
    with Session(engine) as session:
        for row in build_rows():
            session.merge(row)
        session.commit()
    print(f"Seeded company, {len(EXPERT_IDS)} experts, gig {GIG_ID}, task {TASK_ID}")


if __name__ == "__main__":
    main()
