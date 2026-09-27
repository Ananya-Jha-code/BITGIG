"use client";

import { useState } from "react";
import { Crosshair, Minus, MousePointerClick, Plus, RotateCcw } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import GeminiChip from "@/components/GeminiChip";
import HumanEditedMark from "@/components/HumanEditedMark";
import Mono from "@/components/Mono";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { pad2 } from "@/lib/format";
import { ANOMALIES, ANOMALY_META, LABEL_META, LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

const NUDGE = 0.1;

export default function SegmentInspector({ index, segment, total, sopSteps, currentTime, onChange, onRevert }) {
  if (!segment) {
    return (
      <Panel>
        <EmptyState
          icon={MousePointerClick}
          title="Select a segment"
          description="Click a segment on the timeline to review Gemini's label, boundaries and outcome."
          className="border-0 py-12"
        />
      </Panel>
    );
  }

  const isGemini = segment.source === "ai" && !segment.edited;

  return (
    <Panel>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Mono className="text-sm text-foreground">SEG {pad2(index + 1)}</Mono>
          <Mono className="text-xs text-muted-foreground">of {pad2(total)}</Mono>
        </div>
        <div className="flex items-center gap-2">
          {isGemini ? <GeminiChip size="xs">Gemini draft</GeminiChip> : <HumanEditedMark compact />}
          {segment.edited && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-xs" onClick={onRevert} aria-label="Revert to Gemini draft">
                  <RotateCcw />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Revert to Gemini draft</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4">
        <Field label="Label">
          <div className="grid grid-cols-4 gap-1 rounded-lg border border-border p-1" role="radiogroup" aria-label="Label">
            {LABELS.map((key) => {
              const meta = LABEL_META[key];
              const active = segment.label === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange("label", key)}
                  className={cn(
                    "flex h-8 items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-colors duration-150",
                    active ? "bg-elevated text-foreground shadow-[inset_0_0_0_1px_var(--border)]" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
                  {meta.name}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Boundaries">
          <div className="flex flex-col gap-2">
            <BoundaryRow name="Start" field="start" value={segment.start} currentTime={currentTime} onChange={onChange} />
            <BoundaryRow name="End" field="end" value={segment.end} currentTime={currentTime} onChange={onChange} />
            <div className="flex justify-between px-1 text-[11px] text-muted-foreground">
              <span>Duration</span>
              <Mono>{(segment.end - segment.start).toFixed(2)}s</Mono>
            </div>
          </div>
        </Field>

        <Field label="SOP step">
          <Select value={String(segment.sop_step)} onValueChange={(v) => onChange("sop_step", Number(v))}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sopSteps.map((step, i) => (
                <SelectItem key={i} value={String(i)}>
                  <Mono className="text-muted-foreground">{pad2(i + 1)}</Mono>
                  <span className="truncate">{step}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
          <Label htmlFor="success" className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-medium">Step performed correctly</span>
            <span className="text-[11px] font-normal text-muted-foreground">Turn off if the technique failed</span>
          </Label>
          <Switch id="success" checked={segment.success} onCheckedChange={(v) => onChange("success", v)} />
        </div>

        <Field label="Anomaly">
          <div className="flex flex-wrap gap-1.5">
            {[null, ...ANOMALIES].map((key) => {
              const active = segment.anomaly === key;
              return (
                <button
                  key={key ?? "none"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange("anomaly", key)}
                  className={cn(
                    "h-7 rounded-full border px-2.5 text-xs transition-colors duration-150",
                    active
                      ? key
                        ? "border-warning/60 bg-warning/10 text-warning"
                        : "border-foreground/30 bg-elevated text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {key ? ANOMALY_META[key].name : "None"}
                </button>
              );
            })}
          </div>
        </Field>
      </div>
    </Panel>
  );
}

function Panel({ children }) {
  return <section className="overflow-hidden rounded-xl border border-border bg-card">{children}</section>;
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function BoundaryRow({ name, field, value, currentTime, onChange }) {
  const [draft, setDraft] = useState(null);
  const set = (v) => onChange(field, Math.round(v * 100) / 100);
  function commit() {
    const v = parseFloat(draft);
    if (draft != null && !Number.isNaN(v)) set(v);
    setDraft(null);
  }
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 text-xs text-muted-foreground">{name}</span>
      <div className="flex h-9 flex-1 items-center rounded-lg border border-input">
        <Button variant="ghost" size="icon-sm" onClick={() => set(value - NUDGE)} aria-label={`${name} −0.1s`} className="rounded-r-none">
          <Minus />
        </Button>
        <input
          type="text"
          inputMode="decimal"
          value={draft ?? value.toFixed(2)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setDraft(null);
          }}
          aria-label={`${name} time in seconds`}
          className="h-full w-full min-w-0 bg-transparent text-center font-mono text-sm tabular-nums outline-none focus-visible:bg-elevated"
        />
        <Button variant="ghost" size="icon-sm" onClick={() => set(value + NUDGE)} aria-label={`${name} +0.1s`} className="rounded-l-none">
          <Plus />
        </Button>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={() => set(currentTime)} aria-label={`Set ${name.toLowerCase()} to playhead`} className="size-9">
            <Crosshair />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Set to playhead</TooltipContent>
      </Tooltip>
    </div>
  );
}
