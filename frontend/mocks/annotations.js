// Two expert annotations on task_1 that deliberately disagree, so the consensus
// screen has something to show: a boundary shift > 1.0s and an anomaly mismatch.

export const annotations = [
  {
    id: "ann_1",
    task_id: "task_1",
    rater_id: "expert_1",
    segments: [
      { start: 1.2, end: 5.8, label: "aspirate", sop_step: 0, success: true, anomaly: null, source: "ai", edited: false },
      { start: 6.4, end: 11.0, label: "dispense", sop_step: 1, success: true, anomaly: null, source: "ai", edited: false },
      { start: 11.6, end: 17.3, label: "transfer", sop_step: 2, success: true, anomaly: null, source: "ai", edited: false },
      { start: 18.0, end: 23.5, label: "dispense", sop_step: 3, success: false, anomaly: "spill", source: "ai", edited: false },
    ],
    submitted_at: "2026-09-27T14:05:00Z",
  },
  {
    id: "ann_2",
    task_id: "task_1",
    rater_id: "expert_2",
    segments: [
      { start: 1.2, end: 5.8, label: "aspirate", sop_step: 0, success: true, anomaly: null, source: "ai", edited: false },
      { start: 6.4, end: 12.4, label: "dispense", sop_step: 1, success: true, anomaly: null, source: "ai", edited: true },
      { start: 12.9, end: 17.3, label: "transfer", sop_step: 2, success: true, anomaly: null, source: "ai", edited: true },
      { start: 18.0, end: 23.5, label: "dispense", sop_step: 3, success: true, anomaly: null, source: "ai", edited: true },
    ],
    submitted_at: "2026-09-27T14:11:00Z",
  },
];
