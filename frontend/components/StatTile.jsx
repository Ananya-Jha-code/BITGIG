"use client";

import CountUp from "@/components/reactbits/CountUp";
import { cn } from "@/lib/utils";

// value is a number; suffix like "%" is rendered next to it.
export default function StatTile({ label, value, suffix, hint, tone, className }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-lift", className)}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-4xl font-semibold tabular-nums tracking-tight",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success"
        )}
      >
        {value == null ? (
          "—"
        ) : (
          <>
            <CountUp to={value} duration={0.8} separator="," />
            {suffix && <span className="ml-0.5 text-2xl text-muted-foreground">{suffix}</span>}
          </>
        )}
      </span>
      {hint && <span className="text-sm text-muted-foreground">{hint}</span>}
    </div>
  );
}
