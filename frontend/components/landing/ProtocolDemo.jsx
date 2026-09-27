"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ProtocolStage from "@/components/landing/ProtocolStage";
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

      <ProtocolStage step={step} />
    </div>
  );
}
