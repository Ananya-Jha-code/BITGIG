"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, MousePointer2, Sparkles } from "lucide-react";
import Crosshair from "@/components/reactbits/Crosshair";
import { cn } from "@/lib/utils";

/*
  Hero visual: a stained tissue sample under a microscope lens.
  1. Gemini's scan line sweeps down and draws a dashed outline around every cell.
  2. An expert's cursor fixes the one cell Gemini got wrong.
  3. Every outline turns solid: verified.
  Dashed = Gemini's guess, solid = expert-verified; teal = normal, red = abnormal.
*/

const NORMAL = "#23877f";
const ABNORMAL = "#c2412d";
const SCAN_S = 2.6;

// x, y, r in a 100×100 lens; abnormal cells have bigger, darker nuclei.
const CELLS = [
  { x: 30, y: 22, r: 7.5, seed: 1 },
  { x: 52, y: 17, r: 6.5, seed: 2 },
  { x: 71, y: 27, r: 7, seed: 3, abnormal: true },
  { x: 20, y: 42, r: 6.5, seed: 4 },
  { x: 41, y: 38, r: 8, seed: 5 },
  { x: 62, y: 45, r: 7.5, seed: 6, abnormal: true, geminiMissed: true },
  { x: 82, y: 50, r: 6, seed: 7 },
  { x: 28, y: 62, r: 7.5, seed: 8 },
  { x: 48, y: 60, r: 6, seed: 9 },
  { x: 70, y: 67, r: 7, seed: 10 },
  { x: 38, y: 80, r: 7, seed: 11, abnormal: true },
  { x: 58, y: 82, r: 6.5, seed: 12 },
  { x: 15, y: 60, r: 4.5, seed: 13 },
];

const RBCS = [
  [44, 27], [60, 30], [33, 51], [76, 38], [54, 71], [23, 74], [67, 56], [80, 64], [46, 90], [36, 12],
];

// Round so server and client render identical SVG attributes.
const r2 = (n) => Math.round(n * 100) / 100;

function blob(cx, cy, r, seed, points = 28) {
  let d = "";
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const k = 1 + 0.11 * Math.sin(3 * a + seed) + 0.06 * Math.sin(5 * a + seed * 2.3);
    const x = cx + Math.cos(a) * r * k;
    const y = cy + Math.sin(a) * r * k * 0.9;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return `${d}Z`;
}

export default function MicroscopeView() {
  const lensRef = useRef(null);
  const [phase, setPhase] = useState("scan");
  const [cycle, setCycle] = useState(0);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const next = { scan: ["review", (SCAN_S + 0.8) * 1000], review: ["fixed", 1050], fixed: ["verified", 1300], verified: ["reset", 3600], reset: ["scan", 500] }[phase];
    const id = setTimeout(() => {
      if (next[0] === "scan") setCycle((c) => c + 1);
      setPhase(next[0]);
    }, next[1]);
    return () => clearTimeout(id);
  }, [phase]);

  const target = CELLS.find((c) => c.geminiMissed);
  const fixed = phase === "fixed" || phase === "verified";
  const status =
    phase === "scan" || phase === "reset"
      ? { icon: <Sparkles className="size-4" />, text: "Gemini drafting", tone: "text-gemini" }
      : phase === "review" || phase === "fixed"
        ? { icon: <MousePointer2 className="size-4" />, text: "Expert reviewing", tone: "text-foreground" }
        : { icon: <Check className="size-4" strokeWidth={3} />, text: "Verified · 1 fix", tone: "text-success" };

  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      <div className="relative aspect-square">
        {/* Stage ring with degree ticks */}
        <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="49.4" fill="none" stroke="var(--ink)" strokeOpacity="0.14" strokeWidth="0.25" />
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i / 72) * Math.PI * 2;
            const major = i % 6 === 0;
            const inner = 49.4;
            const outer = major ? 47.4 : 48.4;
            return (
              <line
                key={i}
                x1={r2(50 + Math.cos(a) * inner)}
                y1={r2(50 + Math.sin(a) * inner)}
                x2={r2(50 + Math.cos(a) * outer)}
                y2={r2(50 + Math.sin(a) * outer)}
                stroke="var(--ink)"
                strokeOpacity={major ? 0.35 : 0.15}
                strokeWidth="0.25"
              />
            );
          })}
        </svg>
        <span className="absolute top-[-1.75rem] left-1/2 -translate-x-1/2 font-mono text-xs text-muted-foreground">40×</span>

        {/* Lens */}
        <div
          ref={lensRef}
          className="absolute inset-[5.5%] cursor-none overflow-hidden rounded-full shadow-[inset_0_0_60px_rgba(90,20,50,0.28),0_30px_60px_-30px_rgba(90,40,30,0.5)]"
          style={{ background: "radial-gradient(circle at 45% 40%, #fbe9f0 0%, #f4d3e0 55%, #e9bccd 100%)" }}
          onMouseLeave={() => setHover(null)}
        >
          <svg className="absolute inset-0 size-full" viewBox="0 0 100 100">
            {/* tissue fibres */}
            {[12, 30, 48, 66, 84].map((y, i) => (
              <path key={y} d={`M -5 ${y} C 25 ${y - 8 + i * 2}, 60 ${y + 9}, 105 ${y - 3}`} fill="none" stroke="#e7a9c1" strokeOpacity="0.45" strokeWidth="1.6" />
            ))}
            {RBCS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.9" fill="#e48aa9" fillOpacity="0.55" />
            ))}

            {CELLS.map((c, i) => {
              const shape = blob(c.x, c.y, c.r, c.seed);
              const outline = blob(c.x, c.y, c.r * 1.28, c.seed);
              const drafted = phase !== "reset";
              const geminiSays = c.geminiMissed ? false : Boolean(c.abnormal);
              const isAbnormal = c.geminiMissed && fixed ? true : geminiSays;
              const solid = phase === "verified";
              return (
                <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-none">
                  <path d={shape} fill="#f0a9c4" fillOpacity={hover === i ? 0.95 : 0.75} stroke="#d97ea2" strokeOpacity="0.5" strokeWidth="0.3" />
                  {c.abnormal ? (
                    <>
                      <path d={blob(c.x + 0.6, c.y + 0.3, c.r * 0.55, c.seed + 4, 18)} fill="#4b2168" fillOpacity="0.9" />
                      <circle cx={c.x - c.r * 0.25} cy={c.y - c.r * 0.2} r={c.r * 0.12} fill="#2c0f40" />
                    </>
                  ) : (
                    <ellipse cx={c.x + 0.4} cy={c.y + 0.2} rx={c.r * 0.34} ry={c.r * 0.3} fill="#7a4e9e" fillOpacity="0.85" />
                  )}
                  <AnimatePresence>
                    {drafted && (
                      <motion.path
                        key={`${cycle}-${isAbnormal}`}
                        d={outline}
                        fill="none"
                        stroke={isAbnormal ? ABNORMAL : NORMAL}
                        strokeWidth={solid ? 0.55 : 0.45}
                        strokeLinecap="round"
                        strokeDasharray={solid ? "none" : "1.4 1.1"}
                        style={{ transformOrigin: `${c.x}px ${c.y}px`, transformBox: "view-box" }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: phase === "scan" ? (c.y / 100) * SCAN_S : 0, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                  </AnimatePresence>
                </g>
              );
            })}
          </svg>

          {/* Gemini scan line */}
          {phase === "scan" && (
            <motion.div
              key={`scan-${cycle}`}
              className="pointer-events-none absolute inset-x-0 h-12 bg-linear-to-b from-transparent to-primary/25"
              initial={{ top: "-12%" }}
              animate={{ top: "100%" }}
              transition={{ duration: SCAN_S, ease: "linear" }}
            >
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary shadow-[0_0_16px_3px_rgba(214,36,122,0.55)]" />
            </motion.div>
          )}

          {/* Expert cursor fixing Gemini's miss */}
          <AnimatePresence>
            {(phase === "review" || phase === "fixed") && (
              <motion.div
                key={`cursor-${cycle}`}
                className="pointer-events-none absolute z-10"
                initial={{ left: "88%", top: "92%", opacity: 0 }}
                animate={{ left: `${target.x + 2}%`, top: `${target.y + 2}%`, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <MousePointer2 className="size-6 fill-white text-ink drop-shadow" />
                <span className="absolute top-6 left-4 rounded-full bg-ink px-2 py-0.5 font-mono text-[11px] whitespace-nowrap text-white">Dr. Chen</span>
                <motion.span
                  className="absolute -top-3 -left-3 size-6 rounded-full border-2 border-ink"
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: [0.2, 1.8], opacity: [0.8, 0] }}
                  transition={{ delay: 0.95, duration: 0.6 }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Correction tag */}
          <AnimatePresence>
            {fixed && (
              <motion.span
                key={`tag-${cycle}`}
                className="pointer-events-none absolute z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white"
                style={{ left: `${target.x + target.r + 7}%`, top: `${target.y - 2}%` }}
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Check className="size-3" strokeWidth={3} /> abnormal
              </motion.span>
            )}
          </AnimatePresence>

          {/* Hover readout */}
          {hover != null && (
            <span
              className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-md bg-ink px-2 py-1 font-mono text-[11px] whitespace-nowrap text-white"
              style={{ left: `${CELLS[hover].x}%`, top: `${CELLS[hover].y + CELLS[hover].r + 4}%` }}
            >
              cell {String(hover + 1).padStart(2, "0")} · {CELLS[hover].abnormal ? "abnormal" : "normal"}
            </span>
          )}

          <Crosshair containerRef={lensRef} color="rgba(26,26,26,0.35)" />

          {/* scale bar */}
          <div className="pointer-events-none absolute bottom-[14%] left-[16%] flex flex-col items-start gap-1">
            <span className="h-0.5 w-12 bg-ink/60" />
            <span className="font-mono text-[10px] text-ink/60">20 µm</span>
          </div>
        </div>

        {/* Status pill on the lens rim */}
        <div className="absolute bottom-[1.5%] left-1/2 -translate-x-1/2">
          <AnimatePresence mode="wait">
            <motion.span
              key={status.text}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className={cn("inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold whitespace-nowrap shadow-lift", status.tone)}
            >
              {status.icon}
              {status.text}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
      <span className="flex items-center gap-2">
        <svg width="22" height="10" aria-hidden>
          <line x1="1" y1="5" x2="21" y2="5" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
        </svg>
        Gemini
      </span>
      <span className="flex items-center gap-2">
        <svg width="22" height="10" aria-hidden>
          <line x1="1" y1="5" x2="21" y2="5" stroke="currentColor" strokeWidth="2" />
        </svg>
        Expert
      </span>
      <span className="h-4 w-px bg-border-strong" aria-hidden />
      <span className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: NORMAL }} /> Normal
      </span>
      <span className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ background: ABNORMAL }} /> Abnormal
      </span>
    </div>
  );
}
