// MOCK: earnings are display-only and will use mocks/earnings.js. No real payments.
import ComingSoon from "@/components/ComingSoon";

export default function Earnings() {
  return (
    <ComingSoon
      title="Earnings"
      description="Tasks completed and what you've earned will appear here."
    />
  );
}
