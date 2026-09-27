"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, FileVideo, MousePointer2, Sparkles, Upload } from "lucide-react";
import GeminiChip from "@/components/GeminiChip";
import HumanEditedMark from "@/components/HumanEditedMark";
import Mono from "@/components/Mono";
import { cn } from "@/lib/utils";

/*
  "How it works" as a live product demo instead of paragraphs.
  Four steps auto-advance; each one animates the same mini workspace into its next state.
*/

const STEP_MS = 5200;
const EASE = [0.22, 1, 0.36, 1];

const STEPS = [
  { title: "Upload", line: "A lab video and its SOP." },
  { title: "Gemini drafts", line: "Every action segmented and matched to a step." },
  { title: "Experts correct", line: "Verified specialists fix what the model missed." },
  { title: "Consensus", line: "Disagreements flagged, explained, resolved." },
];

const DURATION = 25;
const SEGMENTS = [
  { start: 1.2, end: 5.8, label: "aspirate", name: "Aspirate" },
  { start: 6.4, end: 11.0, label: "dispense", name: "Dispense" },
  { start: 11.6, end: 17.3, label: "transfer", name: "Transfer" },
  { start: 18.0, end: 23.5, label: "dispense", name: "Dispense" },
];
const SOP = ["Aspirate 100 µL from tube A", "Dispense into B1, mix 3×", "Transfer 100 µL to B2", "Dispense into B2, mix 3×"];

const pct = (t) => `${(t / DURATION) * 100}%`;

export default function ProtocolDemo() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(id);
  }, [step, paused]);

  return (
    <div
      className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <ol className="flex flex-col">
        {STEPS.map((s, i) => {
          const active = i === step;
          return (
            <li key={s.title} className="border-t border-border last:border-b">
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={active ? "step" : undefined}
                className="group relative flex w-full items-start gap-6 py-6 text-left"
              >
                <Mono className={cn("pt-1.5 text-sm transition-colors duration-300", active ? "text-primary" : "text-muted-foreground")}>
                  0{i + 1}
                </Mono>
                <div className="flex flex-1 flex-col gap-1">
                  <span
                    className={cn(
                      "text-[clamp(1.5rem,2.4vw,2.25rem)] leading-tight font-bold tracking-tight transition-colors duration-300",
                      active ? "text-foreground" : "text-foreground/35 group-hover:text-foreground/60"
                    )}
                  >
                    {s.title}
                  </span>
                  <AnimatePresence initial={false}>
                    {active && (
                      <motion.span
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="overflow-hidden text-lg text-muted-foreground"
                      >
                        {s.line}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                {active && (
                  <motion.span
                    key={`bar-${step}`}
                    className="absolute -top-px left-0 h-0.5 bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: paused ? 0 : STEP_MS / 1000, ease: "linear" }}
                    style={paused ? { width: "100%" } : undefined}
                    aria-hidden
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <Stage step={step} />
    </div>
  );
}

function Stage({ step }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-float">
      <div className="relative h-64 overflow-hidden bg-ink sm:h-72">
        <div className="bg-grid absolute inset-0" />
        <PipetteScene step={step} />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4">
          <Mono className="text-xs text-white/60">CAM 01 · serial_dilution.mp4</Mono>
          <Mono className="rounded-md bg-white/10 px-2 py-1 text-xs text-white">00:25.00</Mono>
        </div>
        <AnimatePresence>
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-float">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <FileVideo className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold">serial_dilution.mp4</span>
                  <Mono className="text-xs text-muted-foreground">42 MB · 4 SOP steps</Mono>
                </div>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9, type: "spring", stiffness: 400, damping: 20 }}>
                  <CheckCircle2 className="size-6 text-success" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex h-7 items-center justify-between">
          <span className="text-sm font-semibold">Timeline</span>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.25 }}>
              {step === 0 && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Upload className="size-4" /> Uploading
                </span>
              )}
              {step === 1 && <GeminiChip glow>4 segments · aligned to SOP</GeminiChip>}
              {step === 2 && <HumanEditedMark />}
              {step === 3 && (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-success/10 px-3 text-[13px] font-semibold text-success">
                  <CheckCircle2 className="size-4" /> Resolved · ready to export
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <Lane name="Gemini" step={step} kind="gemini" />
        <AnimatePresence>
          {step === 3 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45, ease: EASE }}>
              <Lane name="Rater B" step={step} kind="raterB" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-[76px]">
          <AnimatePresence mode="wait">
            {step <= 1 ? (
              <motion.ol key="sop" className="grid grid-cols-2 gap-2" exit={{ opacity: 0 }}>
                {SOP.map((s, i) => (
                  <motion.li
                    key={s}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors duration-500",
                      step === 1 ? "border-primary/25 bg-primary-soft/60" : "border-border bg-background"
                    )}
                  >
                    <Mono className={step === 1 ? "text-gemini" : "text-muted-foreground"}>0{i + 1}</Mono>
                    <span className="truncate">{s}</span>
                  </motion.li>
                ))}
              </motion.ol>
            ) : step === 2 ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-ink font-mono text-xs font-semibold text-white">MC</span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">Dr. Maya Chen moved the end of step 02</span>
                  <Mono className="text-xs text-muted-foreground">
                    11.00s → <span className="text-foreground">12.40s</span> · logged to audit trail
                  </Mono>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="explain"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary-soft/50 px-4 py-3"
              >
                <Sparkles className="mt-0.5 size-4 shrink-0 text-gemini" />
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold text-gemini">Gemini: </span>
                  Rater B counts the third mix cycle. The SOP says <em>mix 3×</em>, so B&apos;s boundary is right.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Lane({ name, step, kind }) {
  const visible = kind === "raterB" || step >= 1;
  return (
    <div className="flex items-center gap-4">
      <span className="w-16 shrink-0 text-sm font-medium text-muted-foreground">{name}</span>
      <div className="relative h-11 flex-1 overflow-hidden rounded-lg border border-border bg-background">
        {kind === "gemini" && step === 1 && (
          <motion.div
            className="absolute inset-y-0 z-10 w-0.5 bg-primary shadow-[0_0_14px_3px_rgba(214,36,122,0.5)]"
            initial={{ left: "0%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          />
        )}
        {kind === "raterB" && (
          <motion.div
            className="absolute inset-y-0 z-10 border-x border-danger/60 bg-danger/12"
            style={{ left: pct(11.0), width: `calc(${pct(12.9)} - ${pct(11.0)})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          />
        )}
        {visible &&
          SEGMENTS.map((seg, i) => {
            const edited = i === 1 && ((kind === "gemini" && step >= 2) || kind === "raterB");
            const start = i === 2 && (kind === "raterB" || step >= 2) ? 12.9 : seg.start;
            const end = edited ? 12.4 : seg.end;
            return (
              <motion.div
                key={i}
                className={cn(
                  "absolute inset-y-1.5 flex items-center gap-1.5 overflow-hidden rounded-md px-2 text-xs font-semibold text-white",
                  seg.label === "aspirate" && "bg-label-aspirate",
                  seg.label === "dispense" && "bg-label-dispense",
                  seg.label === "transfer" && "bg-label-transfer",
                  edited && "ring-2 ring-ink ring-offset-1"
                )}
                style={{ originX: 0 }}
                initial={kind === "gemini" ? { scaleX: 0, opacity: 0 } : false}
                animate={{ scaleX: 1, opacity: 1, left: pct(start), width: `calc(${pct(end)} - ${pct(start)})` }}
                transition={{
                  scaleX: { delay: kind === "gemini" ? 0.3 + i * 0.4 : 0, duration: 0.5, ease: EASE },
                  opacity: { delay: kind === "gemini" ? 0.3 + i * 0.4 : 0, duration: 0.3 },
                  width: { delay: 0.6, duration: 0.9, ease: EASE },
                  left: { duration: 0.6, ease: EASE },
                }}
              >
                <span className="truncate">{seg.name}</span>
                {kind === "gemini" && !edited && <Sparkles className="ml-auto size-3 shrink-0 opacity-80" />}
              </motion.div>
            );
          })}
        {kind === "gemini" && step === 2 && (
          <motion.div
            className="absolute top-1/2 z-20 text-ink"
            initial={{ left: pct(11.0), y: "-10%", opacity: 0 }}
            animate={{ left: pct(12.4), opacity: 1 }}
            transition={{ left: { delay: 0.6, duration: 0.9, ease: EASE }, opacity: { duration: 0.3 } }}
          >
            <MousePointer2 className="size-5 fill-white" />
          </motion.div>
        )}
        {!visible && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Mono className="text-xs text-muted-foreground">awaiting Gemini…</Mono>
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal pipette moving between wells, in time with the demo.
function PipetteScene({ step }) {
  const wells = [
    { x: 22, label: "A" },
    { x: 50, label: "B1" },
    { x: 78, label: "B2" },
  ];
  return (
    <div className="absolute inset-x-0 bottom-0 h-40">
      {wells.map((w, i) => (
        <div key={w.label} className="absolute bottom-6 flex -translate-x-1/2 flex-col items-center gap-2" style={{ left: `${w.x}%` }}>
          <div className="relative h-14 w-12 overflow-hidden rounded-b-[20px] border-2 border-white/25 border-t-0">
            <motion.div
              className="absolute inset-x-0 bottom-0 bg-label-dispense/70"
              animate={{ height: ["60%", "35%", "55%"][i] }}
              transition={{ duration: 1.2 }}
              style={{ opacity: 1 - i * 0.25 }}
            />
          </div>
          <Mono className="text-[11px] text-white/50">{w.label}</Mono>
        </div>
      ))}
      <motion.div
        className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
        animate={{ left: step === 0 ? ["22%", "22%"] : ["22%", "50%", "78%", "22%"], y: [0, 16, 0, 16, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="h-8 w-5 rounded-t-md bg-white/85" />
        <div className="h-10 w-2 bg-white/70" />
        <div className="h-0 w-0 border-x-4 border-t-[10px] border-x-transparent border-t-white/70" />
      </motion.div>
    </div>
  );
}
