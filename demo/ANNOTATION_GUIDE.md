# Annotation guide (codebook)

Two experts annotate the same clip and the platform scores their agreement, so the
agreement number only means something if both people were given the same rules for
where a segment starts and what it is called. This file is those rules. Anyone
producing or correcting annotations should read it first.

## What one segment is

One segment covers one SOP step, from the moment the operator begins acting on that
step to the moment they begin the next one. Segments are contiguous: the end of a
segment is the start of the next visible step, and the last segment runs to the end
of the clip.

Boundary rules, in priority order:

1. A step starts when the operator's hand or tool first commits to it — the pipette
   tip breaks the liquid surface, the tube leaves the rack, the lid comes off.
   Reaching for an item is not yet the step.
2. A step ends where the next visible step starts. Do not leave gaps for dead time;
   put the dead time at the end of the preceding step.
3. If two SOP steps happen in one continuous motion and cannot be separated, annotate
   them as one segment and pick the lower step index. LSV itself does this and writes
   the timestamp as `s6s7-1'02''`.

## Labels

`label` is one of `aspirate`, `dispense`, `transfer`, `other`.

| Label | Use it when |
|---|---|
| `aspirate` | Liquid is drawn up into the tip and the step ends there |
| `dispense` | Liquid leaves the tip into a destination vessel |
| `transfer` | One continuous draw-then-deliver motion, annotated as a single segment |
| `other` | Mixing, flicking, incubating, rocking, capping, moving vessels, anything not liquid handling |

Default to one `transfer` segment per reagent addition. That is what the generated
gold files do, and it is what `default_label` in `demo/sops/*.json` encodes.

Split a reagent addition into a separate `aspirate` and `dispense` pair only when both
the tip entering the source liquid and the tip entering the destination are clearly
visible and separated by more than about two seconds. Be consistent within a clip:
do not split step 1 and merge step 2.

## Success

`success` is `true` when the step was performed as the SOP describes. Set it to
`false` when the step was attempted but the outcome was wrong or incomplete. A step
that was attempted badly is `success: false`; a step that never happened at all is a
`missed_step` anomaly.

`transform_095_incomplete_spread` is the reference case: the operator applied culture
to the plate but never spread it. Step 5 is `success: false` with `anomaly: null`,
because the step occurred, it just failed.

## Anomalies

`anomaly` is `null`, `spill`, `contamination`, `misalignment`, or `missed_step`.

| Anomaly | Meaning | LSV wording that maps to it |
|---|---|---|
| `contamination` | Sterility broken — reused tip, touched a non-sterile surface, uncovered sterile field | "without changing the pipette tip", "didnt chage tips" |
| `missed_step` | A required step never happened | "Skipped reagent 2 addition", "didnt incubate after adding trypleE" |
| `misalignment` | Right action, wrong target — dispensed into the wrong vessel or wrong well | "Added reagent 2 to reagent 3 instead of mixing tube", "Added reagents to the plate directly" |
| `spill` | Liquid ends up outside the intended vessel | nothing in LSV |
| `null` | No anomaly | empty, or "correct" |

Two things to know about this mapping:

**`spill` has no examples in LSV.** No slice in the dataset describes a spill, so any
`spill` the model or a rater produces cannot be checked against ground truth. Either
keep it out of the demo narrative, or stage one short clip yourself where you knock
over a tube of coloured water and annotate it by hand.

**A missing timestamp is not always an error.** LSV writes `skip` in the `Time_stamp`
column whenever a step is not visible in the recording, which includes steps that were
cut for length. `DJI-034` is labelled correct yet has `s5-skip`, because step 5 is a
20-minute room-temperature incubation that nobody filmed. Those steps are listed as
`expected_absent_steps` in `demo/manifest.json` and marked
`usually_absent_from_recording` in the SOP, and they must never be scored as
`missed_step`. Real omissions only come from the hand-authored `step_findings`.

Missed steps get a `MISSED_STEP_MARKER_S` wide segment (0.4 s) anchored just after the
last step that did happen, rather than a zero-width one, so temporal IoU does not
divide by zero during consensus matching.

## Annotating a new clip

1. Read the SOP in `demo/sops/` and count the steps. Watch the clip once without
   annotating.
2. Watch again and record the start time of each step. Use the same notation LSV uses
   so the parser can read it: `s1-0'12'';s2-0'30'';s3-skip`.
3. Add an entry to the relevant gig in `demo/manifest.json` with the timestamps, the
   true duration, any `expected_absent_steps`, and one `step_findings` entry per
   deviation you saw.
4. Run `python demo/scripts/build_gold.py` and read the printed segment count.
5. Open the generated gold file and check the boundaries against the video. Hand-edit
   the gold file for anything the derivation got wrong, and record the reason in the
   manifest `note` so the next person does not re-derive over your correction.

## Where human judgement is still required

The pipeline derives everything it can from LSV, but three things are yours to decide
and are the actual annotation work:

- Whether a reagent addition is one `transfer` or an `aspirate`/`dispense` pair.
- Which anomaly enum value a free-text LSV issue maps to. "Added reagents to the plate
  directly, without mixing" is both a `misalignment` on the addition steps and a
  `missed_step` on the mixing step; that reading is a judgement call, not a lookup.
- Exact step boundaries. LSV gives one start time per step, rounded to the second.
  Since consensus flags boundary differences above 1.0 s, second-level rounding is
  right at the threshold and is worth tightening by hand on the clips you demo.
