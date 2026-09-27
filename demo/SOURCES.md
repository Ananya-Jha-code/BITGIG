# Data provenance and licensing

Every video and protocol in this folder comes from a public dataset. Nothing here is
patient data and nothing here was recorded by us.

## LSV — primary source

- Repository: [YinkaiW/LSV](https://huggingface.co/datasets/YinkaiW/LSV) on Hugging Face
- License: **CC BY-NC 4.0** (attribution required, non-commercial use only)
- Size: ~315 GB total. We pull single files, never the whole repository.
- Contents: 253 metadata rows across two capture configs — `XMglass` (first-person
  smart glasses, 90 entries) and `DJI` (third-person action camera, 161 entries) —
  plus protocol text files and deliberately-introduced procedural errors.

We use the `DJI` config. Some procedures were captured from both viewpoints, so if the
third-person framing hides pipette detail, the matching `XMglass` slice is worth
trying instead.

### Why this dataset fits

LSV was built for protocol compliance monitoring and procedural error detection, which
is the same problem the lab video gig models. Concretely, its CSV gives us three
columns that map onto our schema with no invention required:

| LSV column | Our field |
|---|---|
| `Protocol` (filename of a protocol text file) | `Gig.sop_steps[]` |
| `Time_stamp` (`s1-0'17'';s2-0'36'';...`) | `Segment.start` / `Segment.sop_step` |
| `Issue (if any)` (free-text error description) | `Segment.anomaly` / `Segment.success` |

### The important limitation

Only about 20 of the 161 `DJI` rows have step timestamps filled in, and most of those
that do also carry an error description. Those rows are the usable ones, and the
manifest is built entirely from them. The rest of the dataset has a protocol and an
operation name but no temporal labels, so it cannot be used as ground truth.

The densest usable cluster is `Mock_Cas9_Delivery.txt`, covering `DJI-033` through
`DJI-040`: eight clips of 25 s to 1 min 40 s against one 7-step protocol, with
correct and faulty runs of the same procedure, each with full step timestamps. That is
why the primary demo gig uses it.

### Cancer-specific footage

`DJI-082` ("Cancer cell lines passaging and drug treatment") and `DJI-084` ("Splitting
cancer cells in 6-well plate") are the two explicitly oncology slices. Neither has a
protocol file or timestamps, so they are listed under `broll` in the manifest and are
only suitable for pitch footage or an unscored live Gemini call.

For the graded flow, the cancer framing rests on the cell-culture work itself: Cas9
delivery into 293T cells and cancer-line passaging are standard cancer-research bench
procedures, and the protocol-compliance problem is identical.

### Attribution

Credit LSV on any slide or screen that shows this footage:

> Lab video footage from the LSV dataset (YinkaiW/LSV, Hugging Face), CC BY-NC 4.0.

The non-commercial clause matters beyond the hackathon. If this becomes a product, the
demo footage cannot ship with it, so keep the loader pointed at the manifest rather
than hardcoding LSV paths anywhere in `backend/`.

## RBCdataset — evaluated, not used

[icimrak/RBCdataset](https://github.com/icimrak/RBCdataset) (CC0) holds two video
sequences of red blood cells flowing through microfluidic devices, annotated with
per-cell bounding boxes and tracking IDs.

It is the wrong shape for this pipeline. Our `Segment` describes a time interval with a
label and an SOP step; RBCdataset describes spatial boxes around cells per frame, with
no human operator, no protocol, and nothing to align to an SOP. Loading it would mean
adding bounding-box fields to `shared/schema.json`, which the demo does not need.

Its CC0 license does make it safe for one thing: a still frame or two as filler imagery
on the mocked pathology screen, where no real annotation logic runs. If you use it that
way, keep the `// MOCK:` comment on the component.

## ScienceDirect article

`https://www.sciencedirect.com/science/article/pii/S2590005626002699` could not be
retrieved — Elsevier blocks automated access. If it points to another annotated
wet-lab video dataset, add it here with its license before using anything from it.
