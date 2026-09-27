# BITGIG

A marketplace for robot training data. Companies post a task spec. People complete it. Gemini sorts each clip before a human looks at it.

This repo is a stub. There is no app, API, or demo code here yet.

## Problem

- Robot teams need labeled clips of a specific task. Most raw footage is empty or off-spec.
- Paying humans to watch every clip wastes money on footage no one should label.
- Failures are useful (they show what not to do) but often get thrown out with the junk.
- Buyers should pay for accepted clips, not for uploads.

## How it is meant to work

Not implemented in this repo. Intended flow:

1. A company posts a task spec.
2. A contributor records the task in simulation (real video later).
3. Gemini sorts the clip using sim/lab state plus the spec, not as a labeling pencil. Buckets: trash, useful fail, useful success, needs a human.
4. Empty / off-spec clips are dropped. Humans never see them.
5. Useful failures are kept.
6. Buyers pay only for accepted clips. Contributors are paid when a clip passes.

We did not invent AI labeling. Encord already uses Gemini/SAM to draw boxes and write captions. The difference here is the filter: should a human even look?

## What is live vs mocked

| Piece | Status |
| --- | --- |
| Task spec posting | Not in this repo |
| Simulation or video capture | Not in this repo |
| Gemini sort (trash / useful fail / useful success / needs a human) | Not in this repo |
| Human review queue | Not in this repo |
| Payments (buyer or contributor) | Not in this repo |
| Real-video path | Not started (later) |

Nothing is mocked here because nothing is built here.

## Setup

There is nothing to install yet.

```bash
git clone <this-repo>
cd BITGIG
```

No env vars. No run command.

## Demo

There is no demo to run.

## Stack

Not chosen in this repo. No `package.json`, `requirements.txt`, or other app files.

## License

TBD. No license file yet.
