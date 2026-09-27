import { cn } from "@/lib/utils";

const STATUS_META = {
  open: { name: "Open", dot: "bg-muted-foreground", text: "text-muted-foreground" },
  in_progress: { name: "In progress", dot: "bg-warning", text: "text-warning" },
  submitted: { name: "Submitted", dot: "bg-label-dispense", text: "text-label-dispense" },
  flagged: { name: "Flagged", dot: "bg-danger", text: "text-danger" },
  resolved: { name: "Resolved", dot: "bg-success", text: "text-success" },
  active: { name: "Active", dot: "bg-success", text: "text-success" },
};

export default function StatusBadge({ status, className }) {
  const meta = STATUS_META[status] ?? STATUS_META.open;
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-full border border-border bg-card px-3 text-[13px] font-semibold",
        meta.text,
        className
      )}
    >
      <span className={cn("size-2 rounded-full", meta.dot)} style={{ animation: status === "in_progress" ? "live-dot 1.6s ease-in-out infinite" : undefined }} aria-hidden />
      {meta.name}
    </span>
  );
}
