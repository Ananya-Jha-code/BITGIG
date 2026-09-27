"use client";

import { ArrowUpRight, ScanSearch, TriangleAlert } from "lucide-react";
import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";
import { pad2 } from "@/lib/format";

// Gemini's second look at the expert's annotation (check_annotation).
export default function GeminiNotes({ issues, onSelect }) {
  return (
    <section className="overflow-hidden rounded-xl border border-primary/20 bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <GeminiChip size="xs">Gemini review</GeminiChip>
          <span className="text-xs text-muted-foreground">Points worth a second look</span>
        </div>
        <Mono className="text-xs text-muted-foreground">{issues.length} notes</Mono>
      </div>
      {issues.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">No issues found in this annotation.</p>
      ) : (
        <ul className="divide-y divide-border">
          {issues.map((issue, i) => {
            const Icon = issue.kind === "anomaly" ? TriangleAlert : ScanSearch;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onSelect(issue.segment_index)}
                  className="group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-elevated/60"
                >
                  <Icon className={issue.kind === "anomaly" ? "mt-0.5 size-4 shrink-0 text-warning" : "mt-0.5 size-4 shrink-0 text-muted-foreground"} aria-hidden />
                  <span className="flex-1 text-sm leading-snug text-foreground/90">{issue.message}</span>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground">
                    <Mono>SEG {pad2(issue.segment_index + 1)}</Mono>
                    <ArrowUpRight className="size-3" aria-hidden />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
