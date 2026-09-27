// Display metadata for segment labels and anomalies.
// Class names are written out in full so Tailwind can see them.

export const LABEL_META = {
  aspirate: {
    name: "Aspirate",
    dot: "bg-label-aspirate",
    bar: "bg-label-aspirate/15 border-label-aspirate/40",
    solid: "bg-label-aspirate border-label-aspirate text-white",
    text: "text-label-aspirate",
  },
  dispense: {
    name: "Dispense",
    dot: "bg-label-dispense",
    bar: "bg-label-dispense/15 border-label-dispense/40",
    solid: "bg-label-dispense border-label-dispense text-white",
    text: "text-label-dispense",
  },
  transfer: {
    name: "Transfer",
    dot: "bg-label-transfer",
    bar: "bg-label-transfer/15 border-label-transfer/40",
    solid: "bg-label-transfer border-label-transfer text-white",
    text: "text-label-transfer",
  },
  other: {
    name: "Other",
    dot: "bg-label-other",
    bar: "bg-label-other/15 border-label-other/40",
    solid: "bg-label-other border-label-other text-white",
    text: "text-label-other",
  },
};

export const LABELS = Object.keys(LABEL_META);

export const ANOMALY_META = {
  spill: { name: "Spill" },
  contamination: { name: "Contamination" },
  misalignment: { name: "Misalignment" },
  missed_step: { name: "Missed step" },
};

export const ANOMALIES = Object.keys(ANOMALY_META);

export const SPECIALTY_META = {
  lab_technician: { name: "Lab technician" },
  pathologist: { name: "Pathologist" },
  radiologist: { name: "Radiologist" },
  geneticist: { name: "Geneticist" },
};
