// Formatting helpers. Anything rendered with these should sit inside <Mono>.

// 6.4 -> "00:06.40"
export function formatTime(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return "--:--.--";
  const clamped = Math.max(0, seconds);
  const mins = Math.floor(clamped / 60);
  const secs = clamped - mins * 60;
  return `${String(mins).padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
}

// 0.724 -> "72.4%"
export function formatPercent(ratio, digits = 1) {
  if (ratio == null) return "—";
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatMoney(amount, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

// 2 -> "02"
export function pad2(n) {
  return String(n).padStart(2, "0");
}
