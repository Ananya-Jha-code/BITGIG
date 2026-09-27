"use client";

import { Cloud, Network, Server, Sparkles } from "lucide-react";
import Mono from "@/components/Mono";
import { COMPUTE_PROVIDERS, estimateCompute } from "@/lib/compute";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS = { gcp: Cloud, aws: Server, azure: Cloud, distributed: Network };

function formatDuration(minutes) {
  if (minutes < 1) return "under a minute";
  if (minutes < 60) return `~${Math.ceil(minutes)} min`;
  return `~${(minutes / 60).toFixed(1)} h`;
}

// Radio cards for where the dataset is processed, each with its own estimate.
export default function ComputeOptions({ value, onChange, videos }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Compute provider">
      {COMPUTE_PROVIDERS.map((p) => {
        const Icon = ICONS[p.id] ?? Cloud;
        const selected = p.id === value;
        const estimate = videos.length ? estimateCompute(p, videos) : null;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(p.id)}
            className={cn(
              "relative flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors duration-150",
              selected ? "border-ink bg-elevated shadow-lift" : "border-border hover:border-border-strong"
            )}
          >
            {p.recommended && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-gemini">
                <Sparkles className="size-3" aria-hidden />
                Recommended
              </span>
            )}
            <span className="flex items-center gap-3">
              <span className={cn("flex size-9 items-center justify-center rounded-lg", selected ? "bg-ink text-white" : "bg-secondary")}>
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="font-semibold">{p.name}</span>
            </span>
            <span className="text-[13px] leading-snug text-muted-foreground">{p.blurb}</span>
            <span className="mt-auto flex items-end justify-between border-t border-border pt-3">
              <Mono className="text-lg font-semibold">{estimate ? formatMoney(estimate.total) : "—"}</Mono>
              <span className="text-right text-xs text-muted-foreground">
                {estimate ? formatDuration(estimate.turnaroundMin) : "add videos"}
                {p.variableSpeed && estimate && <br />}
                {p.variableSpeed && estimate && "speed varies"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Line-item breakdown for the selected provider.
export function ComputeBreakdown({ providerId, videos }) {
  const provider = COMPUTE_PROVIDERS.find((p) => p.id === providerId);
  if (!provider || !videos.length) return null;
  const estimate = estimateCompute(provider, videos);
  return (
    <dl className="grid grid-cols-2 gap-2 text-sm">
      {estimate.lines.map((line) => (
        <div key={line.label} className="contents">
          <dt className="text-muted-foreground">{line.label}</dt>
          <dd className="text-right font-mono">{formatMoney(line.amount)}</dd>
        </div>
      ))}
    </dl>
  );
}
