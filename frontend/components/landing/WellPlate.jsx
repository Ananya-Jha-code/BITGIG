"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BadgeCheck, Sparkles } from "lucide-react";
import Mono from "@/components/Mono";
import { cn } from "@/lib/utils";

/*
  Hero visual: a 96-well plate that Gemini "scans" column by column, tagging each well
  with the action performed on it. Two wells get flagged for expert review, then the plate
  is stamped verified. Loops. Hovering a well shows its readout.
*/

const ROWS = "ABCDEFGH".split("");
const COLS = Array.from({ length: 12 }, (_, i) => i + 1);
const LABEL_FOR_COL = ["aspirate", "aspirate", "aspirate", "dispense", "dispense", "dispense", "transfer", "transfer", "transfer", "dispense", "dispense", "dispense"];
const LABEL_NAME = { aspirate: "Aspirate", dispense: "Dispense", transfer: "Transfer" };
const FLAGGED = new Set(["C7", "F10"]);
const SCAN_STEP_MS = 260;

function dilution(row) {
  return `1:${2 ** row}`;
}

export default function WellPlate() {
  const [scan, setScan] = useState(0);
  const [phase, setPhase] = useState("scanning");
  const [hover, setHover] = useState(null);

  useEffect(() => {
    let timer;
    if (phase === "scanning") {
      timer = setTimeout(() => {
        if (scan < 12) setScan(scan + 1);
        else setPhase("flagged");
      }, scan === 0 ? 700 : SCAN_STEP_MS);
    } else if (phase === "flagged") {
      timer = setTimeout(() => setPhase("verified"), 2400);
    } else {
      timer = setTimeout(() => {
        setScan(0);
        setPhase("scanning");
      }, 3200);
    }
    return () => clearTimeout(timer);
  }, [scan, phase]);

  const status =
    phase === "scanning"
      ? { text: "Gemini pre-segmenting", tone: "gemini" }
      : phase === "flagged"
        ? { text: "2 wells flagged for review", tone: "danger" }
        : { text: "Consensus reached", tone: "success" };

  return (
    <div className="relative rounded-3xl border border-border bg-card p-5 shadow-float sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <Mono className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Plate 96 · Serial dilution</Mono>
          <span className="text-lg font-bold tracking-tight">Run #0427</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={status.text}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-full px-3 text-[13px] font-semibold",
              status.tone === "gemini" && "bg-primary-soft text-gemini",
              status.tone === "danger" && "bg-danger/10 text-danger",
              status.tone === "success" && "bg-success/10 text-success"
            )}
          >
            {status.tone === "gemini" ? (
              <Sparkles className="size-3.5" style={{ animation: "live-dot 1.2s ease-in-out infinite" }} />
            ) : (
              <span className={cn("size-2 rounded-full", status.tone === "danger" ? "bg-danger" : "bg-success")} />
            )}
            {status.text}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="relative mt-5 rounded-2xl border border-border-strong/70 bg-[#f1e7d3] p-3 sm:p-4">
        <div className="grid grid-cols-[18px_repeat(12,minmax(0,1fr))] gap-x-1 gap-y-1.5 sm:gap-x-1.5">
          <span />
          {COLS.map((c) => (
            <Mono key={c} className="text-center text-[11px] text-muted-foreground">
              {c}
            </Mono>
          ))}
          {ROWS.map((r, ri) => (
            <Row key={r} r={r} ri={ri} scan={scan} phase={phase} hover={hover} setHover={setHover} />
          ))}
        </div>

        {phase === "scanning" && scan > 0 && scan <= 12 && (
          <div
            className="pointer-events-none absolute top-2 bottom-2 w-0.5 rounded-full bg-primary shadow-[0_0_18px_4px_rgba(214,36,122,0.45)] transition-[left] ease-linear"
            style={{
              left: `calc(16px + 18px + 6px + (100% - 32px - 18px - 72px) / 12 * ${scan} + 6px * ${scan} - 4px)`,
              transitionDuration: `${SCAN_STEP_MS}ms`,
            }}
            aria-hidden
          />
        )}

        <AnimatePresence>
          {phase === "verified" && (
            <motion.div
              initial={{ opacity: 0, scale: 1.6, rotate: -18 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="pointer-events-none absolute right-5 bottom-5 flex items-center gap-2 rounded-lg border-2 border-[#8a6a1f] bg-beige/95 px-3 py-2 text-[#5a4410] shadow-lift"
            >
              <BadgeCheck className="size-5" />
              <div className="flex flex-col leading-none">
                <span className="font-display text-base tracking-tight">VERIFIED</span>
                <Mono className="mt-1 text-[10px]">2/2 experts · IoU 0.91</Mono>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex h-6 items-center justify-between gap-4 text-sm">
        {hover ? (
          <Mono className="text-foreground">
            <span className="font-semibold">{hover.id}</span>
            <span className="text-muted-foreground"> · </span>
            {hover.label ? LABEL_NAME[hover.label] : "Not yet scanned"}
            <span className="text-muted-foreground"> · dilution {hover.dilution}</span>
            {hover.flagged && <span className="text-danger"> · flagged</span>}
          </Mono>
        ) : (
          <Mono className="text-muted-foreground">Hover a well to inspect</Mono>
        )}
        <Mono className="text-muted-foreground">{String(Math.min(scan, 12) * 8).padStart(2, "0")}/96</Mono>
      </div>
    </div>
  );
}

function Row({ r, ri, scan, phase, hover, setHover }) {
  return (
    <>
      <Mono className="flex items-center text-[11px] text-muted-foreground">{r}</Mono>
      {COLS.map((c, ci) => {
        const id = `${r}${c}`;
        const scanned = ci < scan || phase !== "scanning";
        const label = scanned ? LABEL_FOR_COL[ci] : null;
        const flagged = FLAGGED.has(id) && phase === "flagged";
        const strength = 88 - ri * 9;
        return (
          <button
            key={id}
            type="button"
            tabIndex={-1}
            onMouseEnter={() => setHover({ id, label, dilution: dilution(ri), flagged: FLAGGED.has(id) && phase !== "scanning" })}
            onMouseLeave={() => setHover(null)}
            aria-label={`Well ${id}`}
            className={cn(
              "relative aspect-square w-full rounded-full border transition-[background-color,transform,border-color] duration-500 ease-out hover:scale-125 hover:duration-150",
              scanned ? "border-transparent" : "border-[#d8c7a3] bg-[#fbf6ec] shadow-[inset_0_2px_3px_rgba(90,60,20,0.18)]",
              hover?.id === id && "z-10 ring-2 ring-ink ring-offset-1 ring-offset-[#f1e7d3]"
            )}
            style={{
              backgroundColor: label ? `color-mix(in oklch, var(--label-${label}) ${strength}%, #fbf6ec)` : undefined,
              transitionDelay: scanned && phase === "scanning" ? `${ri * 25}ms` : "0ms",
              animation: flagged ? "pulse-ring 1.1s ease-out infinite" : undefined,
              outline: flagged ? "2px solid var(--danger)" : undefined,
              outlineOffset: flagged ? "2px" : undefined,
            }}
          />
        );
      })}
    </>
  );
}
