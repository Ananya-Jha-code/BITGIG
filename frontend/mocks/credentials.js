// MOCK: sample credential submission for the onboarding preview. Synthetic, not a real license.

export const VERIFICATION_STEPS = [
  { key: "submitted", name: "Submitted", description: "License and documents received." },
  { key: "under_review", name: "Under review", description: "A BITGIG reviewer checks the registry." },
  { key: "verified", name: "Verified", description: "Matching tasks unlock in the marketplace." },
];

export const credentialsByExpert = {
  expert_1: {
    specialty: "lab_technician",
    license_number: "ASCP-MLT-000000",
    document_name: "ascp_mlt_certificate.pdf",
    submitted_at: "2026-09-20T09:12:00Z",
    reviewed_at: "2026-09-22T16:40:00Z",
  },
  expert_3: {
    specialty: "lab_technician",
    license_number: "ASCP-MLT-000001",
    document_name: "ascp_mlt_certificate.pdf",
    submitted_at: "2026-09-26T11:03:00Z",
    reviewed_at: null,
  },
};
