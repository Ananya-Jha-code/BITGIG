// MOCK: synthetic variants for the classification preview. Genes are real names but every
// change, frequency and score here is made up. Not from any patient or database.

export const ACMG_CLASSES = [
  { key: "pathogenic", name: "Pathogenic", short: "P", tone: "border-danger bg-danger text-white" },
  { key: "likely_pathogenic", name: "Likely pathogenic", short: "LP", tone: "border-warning bg-warning text-white" },
  { key: "vus", name: "VUS", short: "VUS", tone: "border-ink bg-ink text-white" },
  { key: "likely_benign", name: "Likely benign", short: "LB", tone: "border-label-dispense bg-label-dispense text-white" },
  { key: "benign", name: "Benign", short: "B", tone: "border-success bg-success text-white" },
];

export const variants = [
  {
    id: "var_1",
    gene: "BRCA2",
    hgvs: "c.1234A>G (p.Lys412Glu)",
    zygosity: "Heterozygous",
    pop_freq: 0.00002,
    in_silico: 0.87,
    criteria: ["PM2", "PP3", "PM1"],
    gemini: { class: "likely_pathogenic", rationale: "Absent from population controls (PM2), predicted damaging by most tools (PP3), and inside a well-established functional domain (PM1). No segregation data yet, so it stops short of Pathogenic." },
  },
  {
    id: "var_2",
    gene: "MLH1",
    hgvs: "c.678del (p.Phe226fs)",
    zygosity: "Heterozygous",
    pop_freq: 0,
    in_silico: null,
    criteria: ["PVS1", "PM2"],
    gemini: { class: "pathogenic", rationale: "Frameshift in a gene where loss of function is a known disease mechanism (PVS1), absent from controls (PM2)." },
  },
  {
    id: "var_3",
    gene: "TP53",
    hgvs: "c.2201C>T (p.Ala734Val)",
    zygosity: "Heterozygous",
    pop_freq: 0.0011,
    in_silico: 0.41,
    criteria: ["PP3", "BP4"],
    gemini: { class: "vus", rationale: "In-silico tools disagree (PP3 vs BP4) and the frequency is too high to call rare but too low to call benign. Evidence is conflicting." },
  },
  {
    id: "var_4",
    gene: "CFTR",
    hgvs: "c.3050G>A (p.Arg1017His)",
    zygosity: "Homozygous",
    pop_freq: 0.034,
    in_silico: 0.12,
    criteria: ["BS1", "BP4"],
    gemini: { class: "likely_benign", rationale: "Allele frequency is higher than expected for the disorder (BS1) and tools predict a tolerated change (BP4)." },
  },
  {
    id: "var_5",
    gene: "APOB",
    hgvs: "c.915T>C (p.Ser305=)",
    zygosity: "Heterozygous",
    pop_freq: 0.21,
    in_silico: 0.03,
    criteria: ["BA1", "BP7"],
    gemini: { class: "benign", rationale: "Common in the general population (BA1) and synonymous with no predicted splice impact (BP7)." },
  },
];

// Short descriptions so the evidence chips are readable without an ACMG cheat sheet.
export const CRITERIA_META = {
  PVS1: { strength: "pathogenic", text: "Null variant, LOF is a known mechanism" },
  PM1: { strength: "pathogenic", text: "In a mutational hot spot or functional domain" },
  PM2: { strength: "pathogenic", text: "Absent or very rare in population controls" },
  PP3: { strength: "pathogenic", text: "Computational evidence supports a damaging effect" },
  BA1: { strength: "benign", text: "Allele frequency above 5%" },
  BS1: { strength: "benign", text: "Frequency greater than expected for disorder" },
  BP4: { strength: "benign", text: "Computational evidence suggests no impact" },
  BP7: { strength: "benign", text: "Synonymous with no predicted splice impact" },
};
