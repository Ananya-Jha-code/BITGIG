import { cn } from "@/lib/utils";

// Timestamps, IDs and numbers. Tabular figures so values don't jitter as they change.
export default function Mono({ className, ...props }) {
  return (
    <span
      className={cn("font-mono text-[0.92em] tabular-nums tracking-tight", className)}
      {...props}
    />
  );
}
