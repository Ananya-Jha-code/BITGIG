"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, Check, Droplet, FileCheck2, MousePointer2, MoveRight, Sparkles, TestTube } from "lucide-react";
import { cn } from "@/lib/utils";

/*
  Right side of "How it works": raw footage becomes trusted data, shown as a film strip.
  0 Upload: raw frames slide in.
  1 Gemini drafts: a scan line tags every frame (and gets frame 3 wrong).
  2 Experts correct: an expert fixes frame 3.
  3 Consensus: two experts check every frame; the strip becomes a verified dataset.
*/

const EASE = [0.22, 1, 0.36, 1];

const LABELS = {
  pick: { name: "Pick up", color: "bg-label-aspirate" },
  add: { name: "Add", color: "bg-label-dispense" },
  move: { name: "Move", color: "bg-label-transfer" },
};

const FRAMES = [
  { icon: TestTube, truth: "pick" },
  { icon: Droplet, truth: "add" },
  { icon: MoveRight, truth: "move", geminiSays: "add" },
  { icon: Droplet, truth: "add" },
];

export default function ProtocolStage({ step }) {
  return (
    <div className="flex flex-col items-center border-t border-border pt-12">
      <div className="relative w-full">
        <Filmstrip step={step} />
      </div>

      <div className="mt-10 flex h-16 items-center justify-center">
        <AnimatePresence mode="wait">
          {step === 3 && (
            <motion.div
              key="dataset"
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.3 }}
            >
              <ArrowDown className="size-5 text-muted-foreground" />
              <motion.span
                initial={{ scale: 0.8, y: -8 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 1.45, type: "spring", stiffness: 300, damping: 18 }}
                className="inline-flex items-center gap-2.5 text-xl font-bold text-success"
              >
                <FileCheck2 className="size-6" />
                dataset.json
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Filmstrip({ step }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-ink px-4 py-3 shadow-float">
      <Sprockets />

      <div className="relative my-3 grid grid-cols-4 gap-3">
        {FRAMES.map((frame, i) => (
          <Frame key={i} frame={frame} i={i} step={step} />
        ))}

        {step === 1 && (
          <motion.div
            className="pointer-events-none absolute -inset-y-2 z-20 w-1 rounded-full bg-primary shadow-[0_0_20px_5px_rgba(214,36,122,0.6)]"
            initial={{ left: "0%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
        )}
      </div>

      <Sprockets />

      {step === 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

function Sprockets() {
  return (
    <div className="flex justify-between px-1" aria-hidden>
      {Array.from({ length: 18 }, (_, i) => (
        <span key={i} className="h-2.5 w-4 rounded-[3px] bg-background/15" />
      ))}
    </div>
  );
}

function Frame({ frame, i, step }) {
  const Icon = frame.icon;
  const wrong = Boolean(frame.geminiSays);
  const labelKey = step === 1 && wrong ? frame.geminiSays : frame.truth;
  const label = LABELS[labelKey];
  const tagged = step >= 1;
  const disagreement = wrong && step === 3;

  return (
    <motion.div
      className={cn("relative aspect-4/3 overflow-hidden rounded-lg bg-ink-soft", wrong && step === 2 && "ring-2 ring-white ring-inset")}
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + i * 0.12, duration: 0.4, ease: EASE }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className={cn("size-10 transition-colors duration-500", tagged ? "text-white" : "text-white/35")} strokeWidth={1.75} />
      </div>

      {/* Label tag */}
      <AnimatePresence mode="wait">
        {tagged && (
          <motion.span
            key={labelKey}
            className={cn("absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold text-white", label.color)}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: step === 1 ? 0.2 + i * 0.25 : step === 2 && wrong ? 0.6 : 0, duration: 0.3, ease: EASE }}
          >
            {step === 1 && <Sparkles className="size-3.5" />}
            {label.name}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Expert fixing Gemini's mistake */}
      <AnimatePresence>
        {wrong && step === 2 && (
          <motion.div
            className="pointer-events-none absolute z-10"
            initial={{ left: "110%", top: "110%", opacity: 0 }}
            animate={{ left: "8%", top: "8%", opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <MousePointer2 className="size-6 fill-white text-ink" />
            <span className="absolute top-0.5 left-7 text-sm font-bold whitespace-nowrap text-white">Dr. Sudhesh Reddy</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two experts sign off each frame */}
      {step === 3 && (
        <div className="absolute top-2 right-2 flex gap-1">
          {[0, 1].map((k) => {
            const late = disagreement && k === 1;
            return (
              <motion.span
                key={k}
                className="flex size-6 items-center justify-center rounded-full text-white"
                initial={{ scale: 0, backgroundColor: late ? "#c2412d" : "#2f855a" }}
                animate={{ scale: 1, backgroundColor: "#2f855a" }}
                transition={{
                  scale: { delay: 0.1 + i * 0.1 + k * 0.06, type: "spring", stiffness: 400, damping: 18 },
                  backgroundColor: { delay: late ? 0.9 : 0, duration: 0.3 },
                }}
              >
                <Check className="size-3.5" strokeWidth={3.5} />
              </motion.span>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
