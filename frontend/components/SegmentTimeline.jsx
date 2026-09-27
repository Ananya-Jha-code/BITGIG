"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, PenLine, Sparkles, TriangleAlert } from "lucide-react";
import { formatTime } from "@/lib/format";
import { LABEL_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

/*
  Shared timeline for the workspace, consensus review and marketing demos.

  lanes: [{ id, title, subtitle, segments, selectedIndex, onSelect, flaggedIndices, reviewedIndices, compact }]
  regions: [{ start, end }] disagreement windows, highlighted across every lane
  currentTime / onSeek: playhead position and click-or-drag to seek
*/
export default function SegmentTimeline({ duration, lanes, currentTime, onSeek, regions = [], className }) {
  const trackRef = useRef(null);
  const scrubbing = useRef(false);
  const [hoverTime, setHoverTime] = useState(null);
  const pct = (t) => `${Math.min(100, Math.max(0, (t / duration) * 100))}%`;

  function timeAt(clientX) {
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * duration * 100) / 100;
  }

  function handlePointerDown(e) {
    if (!onSeek || e.target.closest("[data-segment]")) return;
    scrubbing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onSeek(timeAt(e.clientX));
  }

  function handlePointerMove(e) {
    if (onSeek) setHoverTime(timeAt(e.clientX));
    if (scrubbing.current) onSeek(timeAt(e.clientX));
  }

  function handlePointerUp() {
    scrubbing.current = false;
  }

  return (
    <div className={cn("flex gap-5 select-none", className)}>
      <div className="flex w-36 shrink-0 flex-col">
        <div className="h-7" />
        {lanes.map((lane) => (
          <div key={lane.id} className={cn("mt-2.5 flex flex-col justify-center gap-0.5", lane.compact ? "h-9" : "h-16")}>
            <div className="truncate text-sm font-semibold text-foreground">{lane.title}</div>
            {lane.subtitle && <div className="truncate text-[13px] text-muted-foreground">{lane.subtitle}</div>}
          </div>
        ))}
      </div>

      <div
        ref={trackRef}
        className={cn("relative flex-1", onSeek && "cursor-crosshair")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHoverTime(null)}
      >
        <Ruler duration={duration} pct={pct} />

        {lanes.map((lane) => (
          <Lane key={lane.id} lane={lane} pct={pct} />
        ))}

        {regions.map((region, i) => (
          <div
            key={i}
            className="pointer-events-none absolute top-7 bottom-0 z-10 rounded-md border-x-2 border-danger/70 bg-danger/10"
            style={{ left: pct(region.start), width: `calc(${pct(region.end)} - ${pct(region.start)})` }}
            aria-hidden
          />
        ))}

        {hoverTime != null && (
          <div className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-foreground/25" style={{ left: pct(hoverTime) }} aria-hidden>
            <span className="absolute -top-1 left-1.5 rounded bg-ink px-1.5 py-0.5 font-mono text-[11px] whitespace-nowrap text-white">
              {formatTime(hoverTime)}
            </span>
          </div>
        )}

        {currentTime != null && (
          <div className="pointer-events-none absolute top-4 bottom-0 z-30 w-0.5 -translate-x-1/2 bg-primary" style={{ left: pct(currentTime) }} aria-hidden>
            <div className="absolute -top-1 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-primary" />
          </div>
        )}
      </div>
    </div>
  );
}

function Ruler({ duration, pct }) {
  const major = duration > 40 ? 10 : 5;
  const ticks = [];
  for (let t = 0; t <= Math.floor(duration); t++) ticks.push(t);

  return (
    <div className="relative h-7 border-b border-border-strong/60">
      {ticks.map((t) => {
        const isMajor = t % major === 0;
        return (
          <div key={t} className="absolute bottom-0" style={{ left: pct(t) }}>
            <div className={cn("w-px", isMajor ? "h-3 bg-foreground/40" : "h-1.5 bg-border-strong")} />
            {isMajor && (
              <span
                className={cn(
                  "absolute bottom-3.5 font-mono text-xs text-muted-foreground tabular-nums",
                  t === 0 ? "left-0" : t + major > duration ? "right-0" : "left-0 -translate-x-1/2"
                )}
              >
                {formatTime(t).slice(0, 5)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Lane({ lane, pct }) {
  const flagged = new Set(lane.flaggedIndices ?? []);
  const reviewed = new Set(lane.reviewedIndices ?? []);

  return (
    <div className={cn("relative mt-2.5 rounded-lg bg-secondary/60", lane.compact ? "h-9" : "h-16")}>
      {lane.segments.map((seg, i) => {
        const meta = LABEL_META[seg.label] ?? LABEL_META.other;
        const isSelected = lane.selectedIndex === i;
        const isFlagged = flagged.has(i);
        const isReviewed = reviewed.has(i);
        const isGemini = seg.source === "ai" && !seg.edited;
        const interactive = Boolean(lane.onSelect);
        const Tag = interactive ? motion.button : motion.div;

        return (
          <Tag
            key={i}
            data-segment
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => lane.onSelect(i) : undefined}
            aria-label={`${meta.name}, ${formatTime(seg.start)} to ${formatTime(seg.end)}${isGemini ? ", Gemini draft" : seg.edited ? ", expert-edited" : ""}${seg.anomaly ? `, anomaly: ${seg.anomaly}` : ""}`}
            aria-pressed={interactive ? isSelected : undefined}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ left: pct(seg.start), width: `calc(${pct(seg.end)} - ${pct(seg.start)})`, originX: 0 }}
            className={cn(
              "absolute flex min-w-0 flex-col justify-center overflow-hidden rounded-md border px-2.5 text-left transition-[box-shadow,filter,translate] duration-150",
              lane.compact ? "inset-y-1 px-2 " + meta.bar : "inset-y-1.5 " + meta.solid,
              interactive && "cursor-pointer hover:-translate-y-px hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2",
              isFlagged && "ring-2 ring-danger ring-offset-2 ring-offset-background",
              isSelected && "z-10 ring-[3px] ring-ink ring-offset-2 ring-offset-background"
            )}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              {lane.compact && <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} aria-hidden />}
              <span className={cn("truncate font-semibold", lane.compact ? "text-xs text-foreground/80" : "text-sm")}>{meta.name}</span>
              {!lane.compact && (
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  {seg.anomaly && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-white">
                      <TriangleAlert className="size-3 text-warning" aria-hidden />
                    </span>
                  )}
                  {isReviewed && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-white">
                      <Check className="size-3 text-success" strokeWidth={3} aria-hidden />
                    </span>
                  )}
                  {isGemini ? <Sparkles className="size-3.5 text-white/90" aria-hidden /> : seg.edited ? <PenLine className="size-3.5 text-white/90" aria-hidden /> : null}
                </span>
              )}
            </div>
            {!lane.compact && (
              <div className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-xs text-white/80 tabular-nums">
                <span>
                  {seg.start.toFixed(1)}–{seg.end.toFixed(1)}s
                </span>
                {seg.success === false && <span className="rounded bg-white px-1 text-[10px] font-bold text-danger">FAIL</span>}
              </div>
            )}
          </Tag>
        );
      })}
    </div>
  );
}

// Small legend to sit under a timeline.
export function TimelineLegend({ className }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground", className)}>
      {Object.entries(LABEL_META).map(([key, meta]) => (
        <span key={key} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-sm", meta.dot)} aria-hidden />
          {meta.name}
        </span>
      ))}
      <span className="h-4 w-px bg-border-strong" aria-hidden />
      <span className="inline-flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-gemini" aria-hidden /> Gemini draft
      </span>
      <span className="inline-flex items-center gap-1.5">
        <PenLine className="size-3.5" aria-hidden /> Expert-edited
      </span>
      <span className="inline-flex items-center gap-1.5">
        <TriangleAlert className="size-3.5 text-warning" aria-hidden /> Anomaly
      </span>
    </div>
  );
}
