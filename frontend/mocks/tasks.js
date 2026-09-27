// Synthetic demo tasks. Shapes follow the Task and Segment entities in CLAUDE.md.

export const aiSegmentsGig1 = [
  { start: 1.2, end: 5.8, label: "aspirate", sop_step: 0, success: true, anomaly: null, source: "ai", edited: false },
  { start: 6.4, end: 11.0, label: "dispense", sop_step: 1, success: true, anomaly: null, source: "ai", edited: false },
  { start: 11.6, end: 17.3, label: "transfer", sop_step: 2, success: true, anomaly: null, source: "ai", edited: false },
  { start: 18.0, end: 23.5, label: "dispense", sop_step: 3, success: false, anomaly: "spill", source: "ai", edited: false },
];

export const tasks = [
  {
    id: "task_1",
    gig_id: "gig_1",
    assigned_rater_ids: ["expert_1", "expert_2"],
    ai_segments: aiSegmentsGig1,
    status: "flagged",
  },
  {
    id: "task_2",
    gig_id: "gig_1",
    assigned_rater_ids: [],
    ai_segments: aiSegmentsGig1,
    status: "open",
  },
  {
    id: "task_3",
    gig_id: "gig_1",
    assigned_rater_ids: ["expert_1"],
    ai_segments: aiSegmentsGig1,
    status: "in_progress",
  },
  {
    id: "task_4",
    gig_id: "gig_1",
    assigned_rater_ids: ["expert_2", "expert_3"],
    ai_segments: aiSegmentsGig1,
    status: "resolved",
  },
  {
    id: "task_5",
    gig_id: "gig_2",
    assigned_rater_ids: [],
    ai_segments: [
      { start: 0.8, end: 6.2, label: "aspirate", sop_step: 0, success: true, anomaly: null, source: "ai", edited: false },
      { start: 7.0, end: 14.5, label: "dispense", sop_step: 1, success: true, anomaly: null, source: "ai", edited: false },
      { start: 15.1, end: 20.4, label: "transfer", sop_step: 2, success: true, anomaly: null, source: "ai", edited: false },
    ],
    status: "open",
  },
];
