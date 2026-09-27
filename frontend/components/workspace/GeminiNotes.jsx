"use client";

import { motion } from "motion/react";
import { ArrowUpRight, ScanSearch, Sparkles, TriangleAlert } from "lucide-react";
import Mono from "@/components/Mono";
import { pad2 } from "@/lib/format";

// Gemini's second look at the expert's annotation (check_annotation).
export default function GeminiNotes({ issues, onSelect }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-lift">
      <div className="flex items-center gap-3 border-b border-primary/15 bg-primary-soft/50 px-5 py-4">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
          <Sparkles className="size-4" />
        </span>
        <span className="text-lg font-bold">Gemini flagged {issues.length} things to check</span>
      </div>
      {issues.length === 0 ? (
        <p className="px-5 py-5 text-base text-muted-foreground">Nothing to flag. Nice work.</p>
      ) : (
        <ul className="divide-y divide-border">
          {issues.map((issue, i) => {
            const Icon = issue.kind === "anomaly" ? TriangleAlert : ScanSearch;
            return (
              <motion.li key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>
                <button
                  type="button"
                  onClick={() => onSelect(issue.segment_index)}
                  className="group flex w-full items-start gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-secondary/50"
                >
                  <Icon className={issue.kind === "anomaly" ? "mt-0.5 size-5 shrink-0 text-warning" : "mt-0.5 size-5 shrink-0 text-muted-foreground"} aria-hidden />
                  <span className="flex-1 text-[15px] leading-relaxed">{issue.message}</span>
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors group-hover:border-ink group-hover:text-foreground">
                    <Mono>SEG {pad2(issue.segment_index + 1)}</Mono>
                    <ArrowUpRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                  </span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
