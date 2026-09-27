# CLAUDE.md

Project guide for Claude Code. Read this before making changes.

## Project overview

**<PROJECT_NAME>** is an expert annotation marketplace for lab and medical data. Life-science companies, hospitals, and research labs post annotation gigs; verified specialists (lab technicians, pathologists, radiologists, geneticists) complete them in purpose-built tools. Gemini pre-annotates so experts correct rather than start from scratch, multiple experts review each task, disagreements are flagged automatically, and every change is recorded in an audit log.

This is a **hackathon project sponsored by Google**. Favor Google's stack (Gemini API, Firebase, Cloud Run) and make Gemini visibly central to the demo.

## Scope: what is live vs mocked

The demo must run one flow end to end, reliably:

> Company creates a lab video gig → Gemini pre-segments the video and aligns it to the SOP → two experts annotate → consensus flags a disagreement → Gemini explains it → adjudication → company dashboard updates → dataset export.

**Live (real code, real data flow):** landing/role select, create gig, task marketplace, lab video annotation workspace, consensus review, company dashboard, dataset export.

**Mocked (static UI with fake data, no backend logic):** expert credential onboarding, pathology annotation screen, variant classification screen, expert earnings/payouts.

Rules:
- **Never implement real payments.** Payouts are display-only. No payment SDKs, no wallets, no keys.
- **Never use real patient data.** Mocked medical screens use synthetic or clearly public sample images only.
- Label mocked screens in code with a `// MOCK:` comment at the top of the component.
- Do not add features outside this scope unless asked. Protecting the demo path matters more than breadth.

## Team ownership

| Area | Owner | Directory |
|---|---|---|
| Frontend + pitch | Person 1 | `frontend/` |
| Backend: core platform (auth, users, gigs, tasks, uploads, seed data) | Person 2 | `backend/app/core/` |
| Backend: annotations, consensus, audit log, dashboard, export, earnings calc | Person 3 | `backend/app/annotation/` |
| AI workflow (Gemini pipeline) | Person 4 | `backend/app/ai/` |

When working in someone else's area, keep changes minimal and mention them in the commit message.

## Tech stack

- **Frontend:** Next.js + JavaScript (no TypeScript), Tailwind CSS
- **Backend:** Python 3.11+, FastAPI, Pydantic v2, deployed to Cloud Run
- **Auth:** Firebase Auth (email/password is enough for the demo)
- **Database:** Firestore
- **File storage:** Cloud Storage (videos, SOP files)
- **AI:** Gemini API via the `google-genai` Python SDK, using structured output (response schemas). The model name comes from the `GEMINI_MODEL` env var; do not hardcode it.
- **Gemini is the only AI model in the product.** Do not add OpenAI, Anthropic, or any other LLM provider SDKs or API calls. Google is the sponsor.

## Repo structure

```
/
├── CLAUDE.md
├── shared/
│   └── schema.json          # Source of truth for data shapes
├── frontend/
│   ├── app/                 # Next.js routes (one folder per screen)
│   ├── components/
│   ├── lib/api.js           # All backend calls go through here
│   └── mocks/               # Fake data for mocked screens
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py        # Pydantic models mirroring shared/schema.json
│   │   ├── core/            # Person 2
│   │   ├── annotation/      # Person 3
│   │   └── ai/              # Person 4
│   └── seed/                # Demo seed data + cached AI outputs
└── demo/
    └── videos/              # Demo lab videos (small, committed or linked)
```

## Data model

`shared/schema.json` is the source of truth. **Do not change field names or types without updating the schema, the Pydantic models, and `frontend/lib/api.js` together**, and flag the change to the team.

Core entities:

- **User:** `id`, `name`, `role` (`company` | `expert`), `specialty` (e.g. `lab_technician`), `credential_status` (`verified` | `pending`)
- **Gig:** `id`, `company_id`, `title`, `data_type` (`lab_video`; `pathology` and `variant` exist only in mocks), `video_url`, `sop_steps[]`, `label_schema`, `raters_required`, `required_specialty`, `pay_per_task`, `status`
- **Task:** `id`, `gig_id`, `assigned_rater_ids[]`, `ai_segments[]`, `status` (`open` | `in_progress` | `submitted` | `flagged` | `resolved`)
- **Annotation:** `id`, `task_id`, `rater_id`, `segments[]`, `submitted_at`
- **Segment:**

```json
{
  "start": 3.2,
  "end": 7.8,
  "label": "aspirate",
  "sop_step": 0,
  "success": true,
  "anomaly": null,
  "source": "ai",
  "edited": false
}
```

  - `label`: `aspirate` | `dispense` | `transfer` | `other`
  - `anomaly`: `null` | `spill` | `contamination` | `misalignment` | `missed_step`
  - `source`: `ai` | `human`

- **AuditEvent:** `id`, `task_id`, `actor_id`, `action`, `before`, `after`, `timestamp`. Append-only; never update or delete audit events.

## API endpoints

Core (Person 2):
- `POST /gigs`: create gig, upload video and SOP, trigger AI pipeline, create tasks
- `GET /gigs/{id}`
- `GET /tasks?specialty=...`: marketplace listing
- `GET /tasks/{id}`: includes `ai_segments`

Annotation (Person 3):
- `POST /tasks/{id}/annotations`: save or submit an annotation (writes audit events)
- `GET /tasks/{id}/consensus`: agreement score + disagreements
- `POST /tasks/{id}/adjudicate`: resolve disagreements
- `GET /gigs/{id}/dashboard`: progress, agreement rate, flagged items
- `GET /gigs/{id}/export`: final agreed annotations as JSON
- `GET /experts/{id}/earnings`: tasks completed × pay (display only)

AI (`backend/app/ai/`, called internally by the backend):
- `segment_video(video_uri, sop, *, clip_slug=None) -> AiAnnotateResult`
- `check_annotation(ai_segments, human_segments) -> list[Issue]`
- `explain_disagreement(annotation_a, annotation_b, sop_steps) -> str`

Cache lives in `backend/seed/ai_cache/<clip_slug>.json`. Seed fixtures use `model: seed-fixture` (LSV clocks + SOP default labels). They are not gold and not Gemini output. Live Gemini writes the same envelope with the real model id.

## Consensus logic

Two segments from different raters **match** if their temporal IoU (overlap ÷ union) is ≥ 0.5.

Flag a disagreement when any of these is true:
- a matched pair has different `label`, `sop_step`, or `success` values
- a matched pair's start or end boundaries differ by more than 1.0 second
- one rater marked an `anomaly` and the other did not
- a segment has no match in the other rater's annotation

Agreement score = matched segments with no flags ÷ total unique segments. Keep thresholds as named constants so they're easy to tune.

## AI pipeline

- Upload videos with the Gemini Files API, then call the model with a response schema matching `Segment` so output parses directly.
- Prompts live in `backend/app/ai/prompts/` as plain text files, not inline strings.
- Always pass the SOP steps so the model aligns each segment to a step.
- **Cache results for demo videos** in `backend/seed/ai_cache/`. When a demo video is uploaded, use the cached result if one exists. The live demo must never depend on a slow or failing API call.
- Validate every model response with Pydantic. On a parse failure, retry once, then fall back to the cache.
- Every AI-produced segment has `source: "ai"`. When an expert edits one, set `edited: true` and write an audit event.

## Commands

```bash
# Frontend
cd frontend && npm install
npm run dev          # http://localhost:3000
npm run lint

# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Seed demo data (company, three experts, LSV gigs, fixture cache, synthetic raters)
python -m seed.load

# Rebuild fixture cache only (no Gemini, no gold copy)
python -m app.ai.fixture
```

Update this section if commands change.

## Environment variables

Store these in `.env` files that are gitignored. Never commit secrets.

- `GEMINI_API_KEY` (or `GOOGLE_API_KEY`)
- `GEMINI_MODEL` (optional; default in `backend/app/ai/config.py`)
- `GOOGLE_CLOUD_PROJECT`
- `FIREBASE_*` (frontend config)
- `STORAGE_BUCKET`
- `NEXT_PUBLIC_API_URL`

## Coding conventions

- Frontend is plain JavaScript (`.js`/`.jsx`). Do not use TypeScript.
- Python type hints everywhere; Pydantic models for every request and response.
- All frontend API calls go through `frontend/lib/api.js`.
- Keep components small; one screen per route folder.
- Prefer simple, readable code over clever abstractions. This is a hackathon.
- Do not write test cases.

## Working rules for Claude

- Before starting, check which owner's area the task is in and stay within it.
- Keep the live demo flow working after every change. If a change risks breaking it, say so first.
- Don't introduce new dependencies without a clear reason; mention any you add.
- Don't modify `shared/schema.json` silently.
- When a real implementation isn't feasible in time, suggest a mock and label it clearly.
- Commit messages: `[area] short description`, e.g. `[annotation] add temporal IoU matching`.