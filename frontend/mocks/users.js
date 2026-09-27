// Synthetic demo users. Shapes follow the User entity in CLAUDE.md.

export const users = [
  {
    id: "company_1",
    name: "Helix Bio Labs",
    role: "company",
    specialty: null,
    credential_status: "verified",
  },
  {
    id: "expert_1",
    name: "Dr. Sudhesh Reddy",
    role: "expert",
    specialty: "lab_technician",
    credential_status: "verified",
  },
  {
    id: "expert_2",
    name: "Sam Okafor",
    role: "expert",
    specialty: "lab_technician",
    credential_status: "verified",
  },
  {
    id: "expert_3",
    name: "Priya Raman",
    role: "expert",
    specialty: "lab_technician",
    credential_status: "pending",
  },
];

// Stand-ins for "who is logged in" until Firebase Auth is wired up.
export const DEMO_COMPANY_ID = "company_1";
export const DEMO_EXPERT_ID = "expert_1";
