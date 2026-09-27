// MOCK: synthetic pathology slide annotations. The slide itself is drawn procedurally
// (components/preview/SyntheticSlide.jsx); no patient data and no real images.

export const PATHOLOGY_LABELS = {
  tumor: { name: "Tumor region", color: "#c2412d" },
  necrosis: { name: "Necrosis", color: "#c76a0a" },
  stroma: { name: "Normal stroma", color: "#23877f" },
  lymphocytes: { name: "Lymphocyte cluster", color: "#3d5db3" },
};

// Polygon points are in slide coordinates (viewBox 0 0 800 520).
export const pathologyRegions = [
  {
    id: "reg_1",
    label: "tumor",
    confidence: 0.91,
    source: "ai",
    points: [[180, 120], [300, 90], [390, 150], [380, 260], [290, 300], [190, 250]],
  },
  {
    id: "reg_2",
    label: "necrosis",
    confidence: 0.74,
    source: "ai",
    points: [[260, 170], [320, 160], [340, 210], [300, 240], [255, 220]],
  },
  {
    id: "reg_3",
    label: "stroma",
    confidence: 0.83,
    source: "ai",
    points: [[500, 280], [640, 250], [720, 340], [660, 440], [520, 430], [470, 350]],
  },
  {
    id: "reg_4",
    label: "lymphocytes",
    confidence: null,
    source: "human",
    points: [[560, 90], [640, 80], [670, 150], [610, 180], [555, 150]],
  },
];

export const pathologySlide = {
  id: "SLD-2026-0412",
  stain: "H&E",
  magnification: "20x",
  seed: 7,
};
