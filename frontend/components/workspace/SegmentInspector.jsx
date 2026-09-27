"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Crosshair, Minus, MousePointerClick, Plus, RotateCcw } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import GeminiChip from "@/components/GeminiChip";
import HumanEditedMark from "@/components/HumanEditedMark";
import Mono from "@/components/Mono";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { pad2 } from "@/lib/format";
import { ANOMALIES, ANOMALY_META, LABEL_META, LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

const NUDGE = 0.1;

export default function SegmentInspector({ index, segment, total, reviewed, isLast, sopSteps, currentTime, onChange, onRevert, onConfirm }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
      <AnimatePresence mode="wait" initial={false}>
        {!segment ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <EmptyState
              icon={MousePointerClick}
              title="Pick a segment to review"
              description="Click one on the timeline, or press ] to start with the first."
              className="m-4 py-14"
            />
          </motion.div>
        ) : (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <Body
              index={index}
              segment={segment}
              total={total}
              reviewed={reviewed}
              isLast={isLast}
              sopSteps={sopSteps}
              currentTime={currentTime}
              onChange={onChange}
              onRevert={onRevert}
              onConfirm={onConfirm}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Body({ index, segment, total, reviewed, isLast, sopSteps, currentTime, onChange, onRevert, onConfirm }) {
  const isGemini = segment.source === "ai" && !segment.edited;

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">Segment {pad2(index + 1)}</span>
          <Mono className="text-sm text-muted-foreground">/ {pad2(total)}</Mono>
        </div>
        <div className="flex items-center gap-1.5">
          {isGemini ? <GeminiChip size="xs">Gemini draft</GeminiChip> : <HumanEditedMark compact />}
          {segment.edited && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={onRevert} aria-label="Revert to Gemini draft" className="rounded-full">
                  <RotateCcw />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Revert to Gemini draft</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 p-5">
        <Field label="What happened">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Label">
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
                    "flex h-11 items-center gap-2.5 rounded-xl border px-3.5 text-[15px] font-semibold transition-all duration-150",
                    active ? meta.solid + " shadow-sm" : "border-border bg-background text-foreground/80 hover:border-border-strong hover:text-foreground"
                  )}
                >
                  <span className={cn("size-2.5 rounded-full", active ? "bg-white" : meta.dot)} aria-hidden />
                  {meta.name}
                  {active && <Check className="ml-auto size-4" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="When" hint={<Mono>{(segment.end - segment.start).toFixed(2)}s long</Mono>}>
          <div className="flex flex-col gap-2">
            <BoundaryRow name="Start" field="start" value={segment.start} currentTime={currentTime} onChange={onChange} />
            <BoundaryRow name="End" field="end" value={segment.end} currentTime={currentTime} onChange={onChange} />
          </div>
        </Field>

        <Field label="SOP step">
          <Select value={String(segment.sop_step)} onValueChange={(v) => onChange("sop_step", Number(v))}>
            <SelectTrigger className="h-11 w-full rounded-xl bg-background text-[15px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sopSteps.map((step, i) => (
                <SelectItem key={i} value={String(i)} className="text-[15px]">
                  <Mono className="text-muted-foreground">{pad2(i + 1)}</Mono>
                  <span className="truncate">{step}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <label htmlFor="success" className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
          <span className="text-[15px] font-semibold">Performed correctly</span>
          <Switch id="success" checked={segment.success} onCheckedChange={(v) => onChange("success", v)} />
        </label>

        <Field label="Anomaly">
          <div className="flex flex-wrap gap-2">
            {[null, ...ANOMALIES].map((key) => {
              const active = segment.anomaly === key;
              return (
                <button
                  key={key ?? "none"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange("anomaly", key)}
                  className={cn(
                    "h-9 rounded-full border px-3.5 text-sm font-medium transition-all duration-150",
                    active
                      ? key
                        ? "border-warning bg-warning text-white"
                        : "border-ink bg-ink text-white"
                      : "border-border bg-background text-foreground/75 hover:border-border-strong hover:text-foreground"
                  )}
                >
                  {key ? ANOMALY_META[key].name : "None"}
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="border-t border-border bg-background/60 p-4">
        <Button onClick={onConfirm} className="h-12 w-full rounded-xl text-base font-semibold">
          {reviewed ? "Reviewed" : segment.edited ? "Save correction" : "Looks right"}
          {!isLast && <span className="opacity-70">· next</span>}
          <ArrowRight data-icon="inline-end" className="size-5" />
        </Button>
      </div>
    </>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-muted-foreground">{label}</span>
        {hint && <span className="text-[13px] text-muted-foreground">{hint}</span>}
      </div>
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
      <span className="w-11 text-sm font-medium text-muted-foreground">{name}</span>
      <div className="flex h-11 flex-1 items-center rounded-xl border border-input bg-background">
        <Button variant="ghost" size="icon" onClick={() => set(value - NUDGE)} aria-label={`${name} −0.1s`} className="size-10 rounded-l-xl rounded-r-none">
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
          className="h-full w-full min-w-0 bg-transparent text-center font-mono text-base font-medium tabular-nums outline-none"
        />
        <Button variant="ghost" size="icon" onClick={() => set(value + NUDGE)} aria-label={`${name} +0.1s`} className="size-10 rounded-l-none rounded-r-xl">
          <Plus />
        </Button>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={() => set(currentTime)} aria-label={`Set ${name.toLowerCase()} to playhead`} className="size-11 rounded-xl bg-background">
            <Crosshair className="size-4.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Set to playhead</TooltipContent>
      </Tooltip>
    </div>
  );
}
