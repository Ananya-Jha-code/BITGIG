# BITGIG

Expert annotation for lab protocol video. Gemini pre-annotates SOP-aligned time segments. Specialists correct them. Disagreements between two raters are flagged automatically.

This is not Encord. Encord’s Gemini draws boxes and captions. This Gemini outputs `aspirate | dispense | transfer | other` segments with `success` and `anomaly`, aligned to a 0-based SOP.

## What is live vs fixture

| Piece | Status |
| --- | --- |
| FastAPI gigs, tasks, annotations, consensus, dashboard, export | Live (`backend/`) |
| Gemini `segment_video` (Files API + structured JSON) | Live code; needs `BITGIG_GEMINI_KEY` and a clip file |
| AI cache `backend/seed/ai_cache/<clip_slug>.json` | Live reader (envelope or legacy array) |
| Seed-fixture cache | Offline timelines from LSV clocks + SOP `default_label`. Not gold. Not a Gemini transcript. `model: seed-fixture` |
| Gold JSON | Human ground truth from LSV clocks + hand `step_findings` |
| Synthetic raters (`expert_a` / `expert_b`) | Inputs to disagreement detection. Not human IRR. |
| LSV download + ffmpeg | Scripts in `demo/scripts/`. Videos are gitignored. |
| Payments / wallets | Not in this repo |

## How the AI path works

1. Company creates a gig (or seed loads LSV clips from `demo/manifest.json`).
2. `get_ai_segments` uses cache for that `clip_slug` if present.
3. If there is no cache, `segment_video` uploads the clip with the Gemini Files API and asks for structured segments.
4. Two assigned experts submit annotations. Consensus uses temporal IoU ≥ 0.5 and flags label / SOP / success / anomaly / boundary mismatches.
5. `explain_disagreement` adds a short Gemini note when a key is set; otherwise a local sentence.
6. `check_annotation` compares the AI timeline to one human timeline and writes an audit event on submit.

## Setup

```bash
git clone <this-repo>
cd BITGIG
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL; optional BITGIG_GEMINI_KEY
python -m seed.load
uvicorn app.main:app --reload --port 8000
```

Optional clips (not required for seed or cache):

```bash
pip install -r demo/scripts/requirements.txt
cd demo/scripts
python fetch_lsv.py          # download:true clips only
python make_clips.py
```

## Demo without a Gemini key

`python -m seed.load` writes seed-fixture cache and loads synthetic rater pairs so consensus already has flags. The API does not call Gemini unless a cache file is missing and a key is set.

## Stack

- Backend: Python 3.11+, FastAPI, SQLModel, Postgres
- AI: `google-genai`, model from `GEMINI_MODEL` (default `gemini-2.5-flash` in `backend/app/ai/config.py`)
- Demo media: LSV (YinkaiW/LSV), CC BY-NC 4.0

## License

TBD. Demo footage is CC BY-NC 4.0 (see `demo/SOURCES.md`).
