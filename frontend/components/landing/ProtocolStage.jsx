"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, MousePointer2, Sparkles } from "lucide-react";
import Mono from "@/components/Mono";
import { cn } from "@/lib/utils";

/*
  Right side of "How it works": one open timeline on paper, no cards.
  Segments are linked to SOP steps with drawn connectors, an expert's handwritten
  note shows the correction, and a second expert's lane shows consensus.
*/

const DURATION = 25;
const EASE = [0.22, 1, 0.36, 1];
const COLOR = { pick: "bg-label-aspirate", add: "bg-label-dispense", move: "bg-label-transfer" };

const SEGMENTS = [
  { start: 1.2, end: 5.8, kind: "pick", name: "Pick up" },
  { start: 6.4, end: 11.0, kind: "add", name: "Add" },
  { start: 11.6, end: 17.3, kind: "move", name: "Move" },
  { start: 18.0, end: 23.5, kind: "add", name: "Add" },
];

const SOP = ["Pick up from tube A", "Add to B1, mix 3×", "Move to B2", "Add to B2, mix 3×"];

const CAPTIONS = [
  { left: "serial_dilution.mp4", right: "uploading" },
  { left: "Gemini", right: "4 actions found, each matched to a step", gemini: true },
  { left: "Dr. Maya Chen", right: "reviewing Gemini's draft" },
  { left: "2 experts", right: "1 disagreement" },
];

const pct = (t) => (t / DURATION) * 100;

// Maya's correction: the "Add" ends 1.4 s later, so "Move" starts later too.
function segmentsFor(lane, step) {
  const corrected = lane === "a" ? step >= 2 : false;
  return SEGMENTS.map((s, i) => {
    if (!corrected) return s;
    if (i === 1) return { ...s, end: 12.4 };
    if (i === 2) return { ...s, start: 12.9 };
    return s;
  });
}

export default function ProtocolStage({ step }) {
  const caption = CAPTIONS[step];

  return (
    <div className="flex flex-col border-t border-border pt-6">
      <div className="flex h-8 items-center gap-3 text-base">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2.5"
          >
            {caption.gemini && <Sparkles className="size-4 text-gemini" />}
            <span className={cn("font-semibold", caption.gemini && "text-gemini")}>{caption.left}</span>
            <span className="text-muted-foreground">{caption.right}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 grid grid-cols-[5.5rem_1fr] gap-x-6">
        {/* Ruler */}
        <span />
        <div className="relative h-7">
          <motion.div
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-ink/25"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: EASE }}
          />
          {step === 0 && (
            <motion.div
              key="upload"
              className="absolute bottom-0 left-0 h-[3px] rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.4, ease: "easeInOut" }}
            />
          )}
          {[0, 5, 10, 15, 20, 25].map((t) => (
            <span
              key={t}
              className={cn("absolute bottom-2.5 font-mono text-xs text-muted-foreground", t === 0 ? "" : t === 25 ? "-translate-x-full" : "-translate-x-1/2")}
              style={{ left: `${pct(t)}%` }}
            >
              {t}s
            </span>
          ))}
        </div>

        {/* Lane A */}
        <LaneLabel>{step >= 2 ? "Expert A" : "Gemini"}</LaneLabel>
        <Lane segments={segmentsFor("a", step)} visible={step >= 1} step={step} lane="a" />

        {/* Lane B, only for consensus */}
        <AnimatePresence>
          {step === 3 && (
            <>
              <motion.div key="lb-label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LaneLabel>Expert B</LaneLabel>
              </motion.div>
              <motion.div key="lb-lane" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>
                <Lane segments={segmentsFor("b", step)} visible step={step} lane="b" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Connectors from each segment down to its SOP step */}
        <span />
        <Connectors step={step} />

        {/* SOP */}
        <span className="pt-1 text-sm font-semibold text-muted-foreground">SOP</span>
        <ol className="grid grid-cols-4 gap-5">
          {SOP.map((text, i) => (
            <motion.li
              key={text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: EASE }}
              className="flex flex-col gap-1.5"
            >
              <Mono className={cn("text-sm transition-colors duration-500", step === 1 ? "text-gemini" : "text-muted-foreground")}>0{i + 1}</Mono>
              <span className="text-[15px] leading-snug">{text}</span>
            </motion.li>
          ))}
        </ol>
      </div>

      <div className="mt-10 min-h-16 border-t border-border pt-5">
        <AnimatePresence mode="wait">
          {step === 2 && (
            <motion.p key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 1.4 }} className="font-mono text-sm text-muted-foreground">
              step 02 end · 11.0 s → <span className="font-semibold text-foreground">12.4 s</span> · saved to the audit log
            </motion.p>
          )}
          {step === 3 && (
            <motion.div key="explain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-baseline justify-between gap-4">
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="flex items-baseline gap-2 text-lg">
                <Sparkles className="size-4 translate-y-0.5 text-gemini" />
                <span>
                  <span className="font-semibold text-gemini">Gemini:</span> the SOP says mix 3×. Expert A caught the third mix.
                </span>
              </motion.p>
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2, type: "spring", stiffness: 300, damping: 18 }}
                className="flex items-center gap-1.5 text-base font-semibold text-success"
              >
                <Check className="size-5" strokeWidth={3} /> Resolved
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LaneLabel({ children }) {
  return <span className="flex h-16 items-center text-sm font-semibold text-muted-foreground">{children}</span>;
}

function Lane({ segments, visible, step, lane }) {
  return (
    <div className="relative h-16">
      <div className="absolute inset-x-0 top-1/2 h-px bg-ink/10" />

      {lane === "a" && step === 1 && (
        <motion.div
          className="absolute inset-y-2 z-10 w-0.5 rounded-full bg-primary shadow-[0_0_14px_3px_rgba(214,36,122,0.45)]"
          initial={{ left: "0%" }}
          animate={{ left: "100%" }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        />
      )}

      {step === 3 && (
        <motion.div
          className="absolute -inset-y-1 z-0 border-x-2 border-dashed border-danger/70 bg-danger/8"
          style={{ left: `${pct(11.0)}%`, width: `${pct(12.4) - pct(11.0)}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />
      )}

      {visible &&
        segments.map((seg, i) => (
          <motion.div
            key={i}
            className={cn("absolute inset-y-3 z-10 flex items-center rounded-full px-3.5 text-sm font-semibold text-white", COLOR[seg.kind])}
            style={{ originX: 0 }}
            initial={lane === "a" ? { scaleX: 0, opacity: 0 } : false}
            animate={{ scaleX: 1, opacity: 1, left: `${pct(seg.start)}%`, width: `${pct(seg.end) - pct(seg.start)}%` }}
            transition={{
              scaleX: { delay: 0.3 + i * 0.35, duration: 0.5, ease: EASE },
              opacity: { delay: 0.3 + i * 0.35, duration: 0.3 },
              width: { delay: 0.5, duration: 0.9, ease: EASE },
              left: { delay: 0.5, duration: 0.9, ease: EASE },
            }}
          >
            <span className="truncate">{seg.name}</span>
          </motion.div>
        ))}

      {lane === "a" && step === 2 && (
        <>
          <motion.div
            className="absolute top-1/2 z-20 text-ink"
            initial={{ left: `${pct(11.0)}%`, opacity: 0 }}
            animate={{ left: `${pct(12.4)}%`, opacity: 1 }}
            transition={{ left: { delay: 0.5, duration: 0.9, ease: EASE }, opacity: { duration: 0.2 } }}
          >
            <MousePointer2 className="size-5 fill-white" />
          </motion.div>
          <motion.span
            className="absolute top-[calc(100%+2px)] z-20 font-hand text-[1.7rem] leading-none whitespace-nowrap text-primary"
            style={{ left: `calc(${pct(12.4)}% - 6px)` }}
            initial={{ opacity: 0, y: 6, rotate: -4 }}
            animate={{ opacity: 1, y: 0, rotate: -4 }}
            transition={{ delay: 1.3, duration: 0.45, ease: EASE }}
          >
            ↖ +1.4 s, third mix
          </motion.span>
        </>
      )}

      {lane === "b" && (
        <motion.span
          className="absolute top-[calc(100%+8px)] z-20 font-mono text-xs font-semibold whitespace-nowrap text-danger"
          style={{ left: `calc(${pct(12.4)}% + 10px)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          1.4 s apart · limit 1.0 s
        </motion.span>
      )}
    </div>
  );
}

function Connectors({ step }) {
  const segs = segmentsFor("a", step);
  const cols = [12.5, 37.5, 62.5, 87.5];
  return (
    <svg className="h-16 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {step >= 1 &&
        segs.map((seg, i) => {
          const x = pct((seg.start + seg.end) / 2);
          const cx = cols[i] - 10;
          return (
            <motion.path
              key={`${i}-${step >= 2}`}
              d={`M ${x} 0 C ${x} 55, ${cx} 45, ${cx} 100`}
              fill="none"
              stroke={step === 1 ? "var(--primary)" : "var(--border-strong)"}
              strokeWidth={step === 1 ? 1.5 : 1}
              strokeDasharray={step === 1 ? undefined : "3 4"}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: step === 1 ? 0.6 + i * 0.35 : 0, duration: 0.6, ease: EASE }}
            />
          );
        })}
    </svg>
  );
}
