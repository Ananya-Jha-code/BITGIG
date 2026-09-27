# Demo dataset

Videos, SOPs, and ground-truth annotations for the lab video flow. This folder is the
input side of the AI pipeline: `backend/app/ai/` reads clips and SOP steps from here,
and its cached Gemini output lands in `backend/seed/ai_cache/`.

## Layout

```
demo/
├── manifest.json          # the index: which LSV slice becomes which clip, and why
├── SOURCES.md             # provenance, licensing, attribution
├── ANNOTATION_GUIDE.md    # the codebook raters and reviewers follow
├── sops/                  # SOP steps, one JSON per protocol -> Gig.sop_steps[]
├── videos/
│   ├── raw/               # full-size LSV downloads (gitignored, ~300 MB each)
│   └── clips/             # transcoded clips, small enough to commit
├── annotations/
│   ├── gold/              # ground truth, one JSON per clip -> Segment[]
│   └── raters/            # two synthetic rater variants for the consensus demo
└── scripts/
    ├── lsv.py             # timestamp parser and segment derivation
    ├── fetch_lsv.py       # selective download from Hugging Face
    ├── make_clips.py      # ffmpeg transcode
    └── build_gold.py      # manifest + SOP -> gold and rater annotations
```

`manifest.json` is the source of truth for this folder. Nothing else should hardcode an
LSV path or slice ID.

## Setup

```bash
pip install -r demo/scripts/requirements.txt

cd demo/scripts
python fetch_lsv.py --list      # see the download plan first
python fetch_lsv.py             # ~1.4 GB into demo/videos/raw/
python make_clips.py            # 720p / 15 fps / no audio into demo/videos/clips/
python build_gold.py            # annotations/gold/ and annotations/raters/
```

The scripts import `lsv.py` as a sibling module, so run them from `demo/scripts/`.

Two things worth knowing before the first download:

- **Source files are enormous relative to their length.** A 1 min 35 s clip is a 351 MB
  4K file. Transcoding is not optional; it is what makes the clips committable and
  keeps Gemini Files API uploads fast.
- **This repo lives in OneDrive.** Several GB of raw video in a synced folder will
  thrash OneDrive and can slow the machine down mid-demo. Either exclude
  `demo/videos/raw/` from sync, or point `RAW_DIR` in `lsv.py` at a path outside
  OneDrive. `raw/` is gitignored either way.

`build_gold.py` needs no video files and no network, so you can run it and inspect the
annotation shapes before downloading anything.

## What is in the demo gigs

**`cas9_delivery_293t`** is the primary gig: a 7-step Cas9 delivery protocol with five
downloaded clips of the same procedure, one done correctly and four with a different
planted fault. This is the one to demo, because every anomaly value except `spill` is
exercised and the clips are all under two minutes.

| Clip | LSV slice | Length | Ground-truth fault |
|---|---|---|---|
| `cas9_034_correct` | DJI-034 | 1:35 | none |
| `cas9_033_contamination` | DJI-033 | 1:40 | tip reused across all three reagents |
| `cas9_035_missed_step` | DJI-035 | 1:09 | reagent 2 never added |
| `cas9_040_misalignment` | DJI-040 | 0:25 | reagent dispensed into the wrong tube |
| `cas9_038_combo` | DJI-038 | 0:34 | tip reuse *and* a skipped reagent |

Three more Cas9 clips and a second `bacterial_transformation` gig are in the manifest
with `"download": false`. Flip the flag or pass `--all` if you want them.

Use `cas9_040_misalignment` while developing the pipeline. At 25 seconds it is the
cheapest Gemini call in the set, and it still contains a real fault.

## How annotations get made

LSV ships one start time per protocol step. `build_gold.py` turns that into our
`Segment` shape by ending each step where the next visible step begins, ending the last
step at the clip duration, taking `label` from the SOP's `default_label`, and taking
`success` and `anomaly` from the `step_findings` written by hand in the manifest.

So the division of labour is: LSV supplies the timings, you supply the judgement calls.
`ANNOTATION_GUIDE.md` covers what those calls are and how to make them consistently —
read it before editing any gold file.

The two files in `annotations/raters/` are **synthetic**, marked `"synthetic": true`,
and derived from gold by applying one perturbation per consensus flag rule: a 2.4 s
boundary shift, a label change, a dropped or spurious anomaly, and one omitted segment.
They exist so consensus review has guaranteed disagreements to display. They are not
real human annotations and must not be presented as inter-rater reliability evidence.

`expert_a` shifts every start by 0.3 s, inside all thresholds, so gold vs `expert_a`
should score as full agreement. If it does not, the matching logic has a bug.

## Contract with the rest of the backend

| Consumer | Reads |
|---|---|
| `backend/app/ai/segment_video` | `videos/clips/*.mp4` via Gemini Files API, `sops/*.json` |
| `backend/app/ai/` cache | writes `backend/seed/ai_cache/<clip_slug>.json` |
| `backend/seed/load.py` | `manifest.json`, `sops/`, `annotations/raters/` |
| Consensus review | `annotations/raters/<clip_slug>__expert_{a,b}.json` (synthetic; not human IRR) |

Live Gemini is skipped when a cache file exists so the demo does not wait on the API.
Demo clips are 720p / 15 fps / no audio so Files API uploads stay under 20 MB.

Key the AI cache on `clip_slug`, not on the video filename or an upload ID, so a
re-transcode does not silently orphan the cache.

Step indices are **0-based** everywhere in this folder, matching `Segment.sop_step`.
LSV's own CSV is 1-based (`s1`..`s7`); `lsv.py` does the conversion once, on read.
