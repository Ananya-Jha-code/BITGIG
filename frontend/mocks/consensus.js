// Consensus result for task_1 (annotations ann_1 vs ann_2).
// NOTE: response shape is a frontend guess. Confirm with Person 3 once
// GET /tasks/{id}/consensus is defined in shared/schema.json.

export const consensusByTask = {
  task_1: {
    task_id: "task_1",
    agreement_score: 0.25,
    disagreements: [
      {
        type: "boundary",
        segment_index: 1,
        a: { rater_id: "expert_1", start: 6.4, end: 11.0 },
        b: { rater_id: "expert_2", start: 6.4, end: 12.4 },
        reason: "End boundary differs by 1.4s (threshold 1.0s)",
      },
      {
        type: "boundary",
        segment_index: 2,
        a: { rater_id: "expert_1", start: 11.6, end: 17.3 },
        b: { rater_id: "expert_2", start: 12.9, end: 17.3 },
        reason: "Start boundary differs by 1.3s (threshold 1.0s)",
      },
      {
        type: "anomaly",
        segment_index: 3,
        a: { rater_id: "expert_1", success: false, anomaly: "spill" },
        b: { rater_id: "expert_2", success: true, anomaly: null },
        reason: "One rater marked a spill and a failed step; the other did not",
      },
    ],
    ai_explanation:
      "Both raters agree on the aspirate step. They split on where the mix in well B1 ends: Rater B counts the third mix cycle (11.0s to 12.4s) as part of the dispense, while Rater A starts the transfer there. SOP step 2 says 'mix 3x', which supports Rater B's boundary. For step 4, a droplet lands outside well B2 at about 21.8s; Rater A flagged this as a spill and Rater B did not. Review the frame at 21.8s to resolve.",
  },
};
