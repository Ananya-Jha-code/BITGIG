"use client";

import { Check, CircleDashed, TriangleAlert } from "lucide-react";
import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";
import { pad2 } from "@/lib/format";
import { cn } from "@/lib/utils";

// SOP steps, synced to playback: the step under the playhead is highlighted.
export default function SopPanel({ steps, segments, currentTime, activeStep, onJump }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium">SOP</h2>
          <Mono className="text-xs text-muted-foreground">{steps.length} steps</Mono>
        </div>
        <GeminiChip size="xs">Aligned by Gemini</GeminiChip>
      </div>

      <ol className="flex flex-col p-2">
        {steps.map((step, i) => {
          const segIndex = segments.findIndex((s) => s.sop_step === i);
          const seg = segments[segIndex];
          const active = activeStep === i;
          const done = seg && currentTime > seg.end;

          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => seg && onJump(segIndex)}
                disabled={!seg}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "relative flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150",
                  active ? "bg-elevated" : "hover:bg-elevated/60",
                  !seg && "cursor-not-allowed"
                )}
              >
                {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden />}
                <Mono className={cn("mt-px text-xs", active ? "text-foreground" : "text-muted-foreground")}>{pad2(i + 1)}</Mono>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className={cn("text-sm leading-snug", active || done ? "text-foreground" : "text-foreground/75")}>{step}</span>
                  {seg ? (
                    <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Mono>
                        {seg.start.toFixed(1)}–{seg.end.toFixed(1)}s
                      </Mono>
                      {seg.anomaly && (
                        <span className="inline-flex items-center gap-1 text-warning">
                          <TriangleAlert className="size-3" aria-hidden /> {seg.anomaly.replace("_", " ")}
                        </span>
                      )}
                      {seg.success === false && <span className="text-danger">failed</span>}
                    </span>
                  ) : (
                    <span className="text-[11px] text-warning">No matching segment</span>
                  )}
                </div>
                <span className="mt-0.5 shrink-0" aria-hidden>
                  {done ? (
                    <Check className="size-3.5 text-muted-foreground" />
                  ) : (
                    <CircleDashed className={cn("size-3.5", active ? "text-foreground" : "text-border")} />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
