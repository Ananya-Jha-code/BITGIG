// Synthetic demo gigs. Shapes follow the Gig entity in CLAUDE.md.

export const LABELS = ["aspirate", "dispense", "transfer", "other"];
export const ANOMALIES = ["spill", "contamination", "misalignment", "missed_step"];

export const gigs = [
  {
    // Real LSV demo clip (served from public/demo/clips) with its cached Gemini SOP alignment.
    id: "gig_clip",
    company_id: "company_1",
    title: "Cas9 delivery into 293T cells: protocol compliance",
    data_type: "lab_video",
    video_url: "/demo/clips/cas9_040_misalignment.mp4",
    sop_steps: [
      "Add reagent 1 into a sterile 1.5 mL EP tube.",
      "Add reagent 2 into the EP tube.",
      "Add reagent 3 into the EP tube.",
      "Mix well.",
      "Incubate at room temperature for 20 min.",
      "Add the mixture dropwise into a 10 cm dish of 293T cells (~70-80% confluency).",
      "Gently rock the dish forward and backward to mix.",
    ],
    label_schema: { labels: LABELS, anomalies: ANOMALIES },
    raters_required: 2,
    required_specialty: "lab_technician",
    pay_per_task: 14,
    status: "active",
  },
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
