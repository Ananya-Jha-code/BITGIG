// Synthetic demo gigs. Shapes follow the Gig entity in CLAUDE.md.

export const LABELS = ["aspirate", "dispense", "transfer", "other"];
export const ANOMALIES = ["spill", "contamination", "misalignment", "missed_step"];

export const gigs = [
  {
    id: "gig_1",
    company_id: "company_1",
    title: "Serial dilution pipetting QC",
    data_type: "lab_video",
    video_url: "/demo/serial-dilution.mp4",
    sop_steps: [
      "Aspirate 100 µL from stock tube A",
      "Dispense into well B1 and mix 3x",
      "Transfer 100 µL from B1 to B2",
      "Dispense into B2 and mix 3x",
    ],
    label_schema: { labels: LABELS, anomalies: ANOMALIES },
    raters_required: 2,
    required_specialty: "lab_technician",
    pay_per_task: 12,
    status: "active",
  },
  {
    id: "gig_2",
    company_id: "company_1",
    title: "PCR plate setup review",
    data_type: "lab_video",
    video_url: "/demo/pcr-setup.mp4",
    sop_steps: [
      "Aspirate master mix from reservoir",
      "Dispense 20 µL into each well of row A",
      "Transfer template DNA to row A",
    ],
    label_schema: { labels: LABELS, anomalies: ANOMALIES },
    raters_required: 2,
    required_specialty: "lab_technician",
    pay_per_task: 15,
    status: "active",
  },
];
