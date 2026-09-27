"use client";

import { motion } from "motion/react";
import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";

const LETTERS = "BITGIG".split("");

// The brand mark at full scale: magenta Archivo Black on beige, letters rising in on view.
export default function BrandFooter() {
  return (
    <footer className="overflow-hidden border-t border-beige-deep bg-beige">
      <div className="mx-auto flex max-w-360 flex-wrap items-center justify-between gap-4 px-6 pt-8 lg:px-10">
        <Mono className="text-sm text-ink/60">Expert annotation for lab & medical data</Mono>
        <GeminiChip>Built on Gemini · Google Cloud</GeminiChip>
      </div>
      <div className="mx-auto flex max-w-360 justify-center px-4" aria-label="BITGIG">
        {LETTERS.map((l, i) => (
          <motion.span
            key={i}
            initial={{ y: "60%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[clamp(6rem,24vw,23rem)] leading-[0.82] tracking-[-0.03em] text-primary select-none"
            aria-hidden
          >
            {l}
          </motion.span>
        ))}
      </div>
    </footer>
  );
}
