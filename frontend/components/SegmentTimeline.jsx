"use client";

import { useRef } from "react";
import { PenLine, Sparkles, TriangleAlert } from "lucide-react";
import { formatTime } from "@/lib/format";
import { LABEL_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

/*
  Shared timeline for the workspace, consensus review and landing preview.

  lanes: [{ id, title, subtitle, segments, selectedIndex, onSelect, flaggedIndices, compact }]
  regions: [{ start, end }] disagreement windows, highlighted across every lane
  currentTime / onSeek: playhead position and click-or-drag to seek
*/
export default function SegmentTimeline({
  duration,
  lanes,
  currentTime,
  onSeek,
  regions = [],
  className,
}) {
  const trackRef = useRef(null);
  const scrubbing = useRef(false);
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
    if (scrubbing.current) onSeek(timeAt(e.clientX));
  }

  function handlePointerUp() {
    scrubbing.current = false;
  }

  return (
    <div className={cn("flex gap-4 select-none", className)}>
      <div className="flex w-32 shrink-0 flex-col">
        <div className="h-6" />
        {lanes.map((lane) => (
          <div
            key={lane.id}
            className={cn(
              "mt-2 flex flex-col justify-center gap-0.5",
              lane.compact ? "h-7" : "h-14"
            )}
          >
            <div className="truncate text-xs font-medium text-foreground">{lane.title}</div>
            {lane.subtitle && (
              <div className="truncate text-[11px] text-muted-foreground">{lane.subtitle}</div>
            )}
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
      >
        <Ruler duration={duration} pct={pct} />

        {lanes.map((lane) => (
          <Lane key={lane.id} lane={lane} pct={pct} />
        ))}

        {regions.map((region, i) => (
          <div
            key={i}
            className="pointer-events-none absolute top-6 bottom-0 rounded-sm border-x border-danger/60 bg-danger/10"
            style={{ left: pct(region.start), width: `calc(${pct(region.end)} - ${pct(region.start)})` }}
            aria-hidden
          />
        ))}

        {currentTime != null && (
          <div
            className="pointer-events-none absolute top-3.5 bottom-0 z-20 w-px bg-foreground"
            style={{ left: pct(currentTime) }}
            aria-hidden
          >
            <div className="absolute -top-0.5 left-1/2 size-2 -translate-x-1/2 rotate-45 rounded-[1px] bg-foreground" />
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
    <div className="relative h-6 border-b border-border">
      {ticks.map((t) => {
        const isMajor = t % major === 0;
        return (
          <div key={t} className="absolute bottom-0" style={{ left: pct(t) }}>
            <div className={cn("w-px", isMajor ? "h-2.5 bg-muted-foreground/60" : "h-1.5 bg-border")} />
            {isMajor && (
              <span
                className={cn(
                  "absolute bottom-3 font-mono text-[10px] text-muted-foreground tabular-nums",
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

  return (
    <div
      className={cn(
        "relative mt-2 rounded-md border border-border/60 bg-background/60",
        lane.compact ? "h-7" : "h-14"
      )}
    >
      {lane.segments.map((seg, i) => {
        const meta = LABEL_META[seg.label] ?? LABEL_META.other;
        const isSelected = lane.selectedIndex === i;
        const isFlagged = flagged.has(i);
        const isGemini = seg.source === "ai" && !seg.edited;
        const interactive = Boolean(lane.onSelect);
        const Tag = interactive ? "button" : "div";

        return (
          <Tag
            key={i}
            data-segment
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => lane.onSelect(i) : undefined}
            aria-label={`${meta.name}, ${formatTime(seg.start)} to ${formatTime(seg.end)}${isGemini ? ", Gemini draft" : seg.edited ? ", human-edited" : ""}${seg.anomaly ? `, anomaly: ${seg.anomaly}` : ""}`}
            aria-pressed={interactive ? isSelected : undefined}
            className={cn(
              "absolute inset-y-1 flex min-w-0 flex-col justify-center overflow-hidden rounded-[5px] border px-2 text-left transition-[background-color,box-shadow] duration-150",
              meta.bar,
              interactive && "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2",
              isFlagged && "border-danger bg-danger/15 hover:bg-danger/20",
              isSelected && "z-10 ring-2 ring-foreground ring-offset-2 ring-offset-background",
              lane.compact && "inset-y-0.5 px-1.5 opacity-70"
            )}
            style={{ left: pct(seg.start), width: `calc(${pct(seg.end)} - ${pct(seg.start)})` }}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} aria-hidden />
              <span className={cn("truncate font-medium text-foreground/90", lane.compact ? "text-[10px]" : "text-xs")}>
                {meta.name}
              </span>
              {!lane.compact && (
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  {seg.anomaly && <TriangleAlert className="size-3 text-warning" aria-hidden />}
                  {isGemini ? (
                    <Sparkles className="size-3 text-gemini" aria-hidden />
                  ) : seg.edited ? (
                    <PenLine className="size-3 text-foreground/70" aria-hidden />
                  ) : null}
                </span>
              )}
            </div>
            {!lane.compact && (
              <div className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[10px] text-muted-foreground tabular-nums">
                <span>
                  {seg.start.toFixed(1)}–{seg.end.toFixed(1)}s
                </span>
                {seg.success === false && <span className="text-danger">FAIL</span>}
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
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground", className)}>
      {Object.entries(LABEL_META).map(([key, meta]) => (
        <span key={key} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
          {meta.name}
        </span>
      ))}
      <span className="h-3 w-px bg-border" aria-hidden />
      <span className="inline-flex items-center gap-1.5">
        <Sparkles className="size-3 text-gemini" aria-hidden /> Gemini draft
      </span>
      <span className="inline-flex items-center gap-1.5">
        <PenLine className="size-3 text-foreground/70" aria-hidden /> Human-edited
      </span>
      <span className="inline-flex items-center gap-1.5">
        <TriangleAlert className="size-3 text-warning" aria-hidden /> Anomaly
      </span>
    </div>
  );
}
