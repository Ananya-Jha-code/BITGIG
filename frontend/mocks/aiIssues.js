// Output of Gemini's check_annotation(ai_segments, human_segments) for gig_1 videos.
// NOTE: Issue shape is a frontend guess. Confirm with Person 4.

export const issuesByGig = {
  gig_1: [
    {
      segment_index: 1,
      kind: "boundary",
      message: "SOP step 2 says \"mix 3x\", but only two mix cycles finish before 11.0s. The dispense may end later.",
    },
    {
      segment_index: 3,
      kind: "anomaly",
      message: "Possible spill near 00:21.80: a droplet lands outside well B2.",
    },
  ],
};
