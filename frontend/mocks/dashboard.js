// Company dashboard per gig.
// NOTE: response shape is a frontend guess. Confirm with Person 3 once
// GET /gigs/{id}/dashboard is defined in shared/schema.json.

export const dashboardByGig = {
  gig_1: {
    gig_id: "gig_1",
    total_tasks: 4,
    tasks_by_status: { open: 1, in_progress: 1, submitted: 0, flagged: 1, resolved: 1 },
    agreement_rate: 0.72,
    ai_segments_accepted_rate: 0.64,
    flagged_items: [
      { task_id: "task_1", reason: "Boundary and anomaly disagreement on steps 2 to 4" },
    ],
  },
  gig_2: {
    gig_id: "gig_2",
    total_tasks: 1,
    tasks_by_status: { open: 1, in_progress: 0, submitted: 0, flagged: 0, resolved: 0 },
    agreement_rate: null,
    ai_segments_accepted_rate: null,
    flagged_items: [],
  },
};
