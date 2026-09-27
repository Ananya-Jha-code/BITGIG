"use client";

import { Check, TriangleAlert } from "lucide-react";
import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";
import { pad2 } from "@/lib/format";
import { cn } from "@/lib/utils";

// SOP steps, synced to playback: the step under the playhead is highlighted.
export default function SopPanel({ steps, segments, reviewed, activeStep, onJump }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <span className="text-lg font-bold">SOP</span>
        <GeminiChip size="xs">Aligned by Gemini</GeminiChip>
      </div>

      <ol className="relative flex flex-col p-3">
        {steps.map((step, i) => {
          const segIndex = segments.findIndex((s) => s.sop_step === i);
          const seg = segments[segIndex];
          const active = activeStep === i;
          const done = segIndex >= 0 && reviewed.has(segIndex);

          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => seg && onJump(segIndex)}
                disabled={!seg}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "relative flex w-full items-start gap-3.5 rounded-xl px-3 py-3 text-left transition-all duration-200",
                  active ? "bg-primary-soft/70" : "hover:bg-secondary/70",
                  !seg && "cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold transition-colors duration-200",
                    done ? "bg-success text-white" : active ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : pad2(i + 1)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className={cn("text-[15px] leading-snug font-medium", active ? "text-foreground" : "text-foreground/80")}>{step}</span>
                  {seg ? (
                    <span className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                      <Mono>
                        {seg.start.toFixed(1)}–{seg.end.toFixed(1)}s
                      </Mono>
                      {seg.anomaly && (
                        <span className="inline-flex items-center gap-1 font-medium text-warning">
                          <TriangleAlert className="size-3.5" /> {seg.anomaly.replace("_", " ")}
                        </span>
                      )}
                      {seg.success === false && <span className="font-medium text-danger">failed</span>}
                    </span>
                  ) : (
                    <span className="text-[13px] font-medium text-warning">No matching segment</span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
