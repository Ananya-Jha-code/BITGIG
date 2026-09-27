// Display-only earnings and a simulated payout flow. No real payments anywhere in BITGIG:
// no payment SDKs, no wallet connections, no keys. Accounts below are fake and masked.

export const earningsByExpert = {
  expert_1: {
    expert_id: "expert_1",
    tasks_completed: 18,
    total_earned: 216,
    available_balance: 84,
    currency: "USD",
    recent: [
      { task_id: "task_1", gig_title: "Serial dilution pipetting QC", amount: 12, completed_at: "2026-09-27T14:05:00Z" },
      { task_id: "task_4", gig_title: "Serial dilution pipetting QC", amount: 12, completed_at: "2026-09-26T10:40:00Z" },
    ],
    payout_history: [
      { id: "po_1042", method: "bank", amount: 72, status: "paid", requested_at: "2026-09-20T09:00:00Z" },
      { id: "po_1017", method: "paypal", amount: 60, status: "paid", requested_at: "2026-09-13T09:00:00Z" },
    ],
  },
};

// fee: flat USD. feePct: fraction of the amount.
export const payoutMethods = [
  { id: "bank", name: "Bank transfer", account: "Chase •••• 4821", eta: "1–2 business days", fee: 0, feePct: 0 },
  { id: "paypal", name: "PayPal", account: "s.reddy@example.com", eta: "Within minutes", fee: 0, feePct: 0.02 },
  { id: "crypto", name: "Crypto (USDC)", account: "Base · 0x3f7a…9a2c", eta: "About 5 minutes", fee: 0.5, feePct: 0 },
  { id: "wise", name: "Wise", account: "Wise USD •••• 1190", eta: "Same day", fee: 0.8, feePct: 0 },
];
