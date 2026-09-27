"use client";

import { motion } from "motion/react";
import { ArrowRight, Microscope } from "lucide-react";
import WellPlate from "@/components/landing/WellPlate";
import Magnet from "@/components/reactbits/Magnet";
import RotatingText from "@/components/reactbits/RotatingText";
import { useChooseRole } from "@/lib/role";

const EASE = [0.22, 1, 0.36, 1];

// Each headline line slides up from behind a mask.
function Line({ children, delay, className }) {
  return (
    <span className="block overflow-hidden pb-2">
      <motion.span
        className={`block ${className ?? ""}`}
        initial={{ y: "105%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero() {
  const choose = useChooseRole();

  return (
    <section className="mx-auto grid w-full max-w-360 items-center gap-14 px-6 pt-14 pb-20 lg:grid-cols-[1.1fr_1fr] lg:px-10 lg:pt-20">
      <div className="flex flex-col gap-9">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 font-mono text-[13px] font-medium tracking-wider text-muted-foreground uppercase"
        >
          <span className="size-2 rounded-full bg-primary" style={{ animation: "live-dot 1.6s ease-in-out infinite" }} />
          Expert annotation for the life sciences
        </motion.div>

        <h1 className="font-display text-[clamp(3.25rem,7vw,6.5rem)] leading-[0.92] tracking-[-0.02em]">
          <Line delay={0.1}>Gemini drafts.</Line>
          <Line delay={0.22} className="text-primary">
            Experts decide.
          </Line>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: EASE }}
          className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[clamp(1.25rem,1.8vw,1.6rem)] leading-tight font-medium text-foreground/80"
        >
          <span>Verified specialists label your</span>
          <RotatingText
            texts={["lab videos", "pathology slides", "genomic variants", "PCR runs"]}
            mainClassName="overflow-hidden rounded-xl bg-ink px-3 py-1 font-semibold text-beige"
            splitLevelClassName="overflow-hidden pb-0.5"
            staggerFrom="last"
            staggerDuration={0.02}
            rotationInterval={2400}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
          className="flex flex-wrap items-center gap-4"
        >
          <Magnet padding={60} magnetStrength={4}>
            <button
              type="button"
              onClick={() => choose("company")}
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-primary pr-2 pl-7 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(214,36,122,0.7)] transition-colors duration-200 hover:bg-[#c01f6d]"
            >
              Post a gig
              <span className="flex size-10 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:-rotate-45">
                <ArrowRight className="size-5" />
              </span>
            </button>
          </Magnet>
          <button
            type="button"
            onClick={() => choose("expert")}
            className="inline-flex h-14 items-center gap-2.5 rounded-full border-2 border-ink px-6 text-base font-semibold transition-colors duration-200 hover:bg-ink hover:text-white"
          >
            <Microscope className="size-5" />
            I&apos;m an expert
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: EASE }}
      >
        <WellPlate />
      </motion.div>
    </section>
  );
}
