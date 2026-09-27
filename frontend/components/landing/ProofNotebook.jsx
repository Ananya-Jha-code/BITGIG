"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

/*
  Hero visual. Gemini types a plain-English draft of what it sees; an expert's pen
  strikes the mistake, writes the correction by hand, and signs it off.
  Cycles through a lab video, a pathology slide and a genomic variant.
*/

export const PAGES = [
  {
    kind: "Lab video",
    source: "serial_dilution.mp4",
    rows: [
      { mark: "00:03", text: "Picks up the sample tube" },
      { mark: "00:07", before: "Adds ", wrong: "100 µL", fix: "50 µL", after: " to well B1" },
      { mark: "00:12", text: "Mixes three times" },
      { mark: "00:18", text: "A drop spills outside B2", flag: true },
    ],
    expert: "Maya Chen",
    role: "Lab technician",
  },
  {
    kind: "Pathology slide",
    source: "biopsy_slide_04.svs",
    rows: [
      { mark: "R1", text: "Healthy tissue" },
      { mark: "R2", before: "", wrong: "Healthy tissue", fix: "Tumour edge", after: "" },
      { mark: "R3", text: "Inflamed area", flag: true },
    ],
    expert: "Amara Osei",
    role: "Pathologist",
  },
  {
    kind: "Genomic variant",
    source: "sample_17.vcf",
    rows: [
      { mark: "GENE", text: "BRCA2 deletion at c.5946" },
      { mark: "CALL", before: "Likely ", wrong: "harmless", fix: "disease-causing", after: "" },
      { mark: "WHY", text: "Matches 3 published cases" },
    ],
    expert: "Lena Park",
    role: "Geneticist",
  },
];

const TYPE_MS = 26;
const ROW_PAUSE_MS = 220;
const EASE = [0.22, 1, 0.36, 1];

// [3, 4, 2] -> [3, 7, 9]
function runningTotals(values) {
  const out = [];
  let sum = 0;
  for (const v of values) {
    sum += v;
    out.push(sum);
  }
  return out;
}

function rowText(row) {
  return row.text ?? `${row.before}${row.wrong}${row.after}`;
}

export default function ProofNotebook({ page, onPageChange }) {
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState("typing");
  const data = PAGES[page];

  const lengths = useMemo(() => data.rows.map((r) => rowText(r).length), [data]);
  const ends = useMemo(() => runningTotals(lengths), [lengths]);
  const total = ends[ends.length - 1];
  // Character counts at which a row finishes, so typing pauses briefly between rows.
  const rowEnds = useMemo(() => new Set(ends.slice(0, -1)), [ends]);

  useEffect(() => {
    let id;
    if (phase === "typing") {
      if (typed < total) {
        id = setTimeout(() => setTyped(typed + 1), rowEnds.has(typed) ? ROW_PAUSE_MS : TYPE_MS);
      } else {
        id = setTimeout(() => setPhase("pen"), 450);
      }
    } else if (phase === "pen") {
      id = setTimeout(() => setPhase("signed"), 1300);
    } else if (phase === "signed") {
      id = setTimeout(() => setPhase("out"), 2800);
    } else {
      id = setTimeout(() => {
        setTyped(0);
        setPhase("typing");
        onPageChange((page + 1) % PAGES.length);
      }, 450);
    }
    return () => clearTimeout(id);
  }, [typed, phase, total, rowEnds, page, onPageChange]);

  function jump(i) {
    if (i === page) return;
    setTyped(0);
    setPhase("typing");
    onPageChange(i);
  }

  const penDown = phase === "pen" || phase === "signed" || phase === "out";

  return (
    <div className="relative">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-4">
        <div className="flex items-baseline gap-3">
          <AnimatePresence mode="wait">
            <motion.span
              key={data.kind}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-xl font-bold tracking-tight"
            >
              {data.kind}
            </motion.span>
          </AnimatePresence>
          <span className="font-mono text-[13px] text-muted-foreground">{data.source}</span>
        </div>
        <div className="flex items-center gap-2" role="tablist" aria-label="Examples">
          {PAGES.map((p, i) => (
            <button
              key={p.kind}
              type="button"
              role="tab"
              aria-selected={i === page}
              aria-label={p.kind}
              onClick={() => jump(i)}
              className="group flex h-6 items-center"
            >
              <span className={cn("block h-1.5 rounded-full transition-all duration-300", i === page ? "w-6 bg-primary" : "w-1.5 bg-ink/20 group-hover:bg-ink/40")} />
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.ol
          key={page}
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "out" ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="relative mt-2"
        >
          <span className="absolute top-0 bottom-0 left-[4.25rem] w-px bg-primary/35" aria-hidden />
          {data.rows.map((row, i) => {
            const len = lengths[i];
            const shown = Math.max(0, Math.min(len, typed - (ends[i] - len)));
            const typing = phase === "typing" && shown > 0 && shown < len;
            const started = shown > 0;
            return (
              <li key={i} className="grid min-h-19 grid-cols-[4.25rem_1fr] items-end pb-3">
                <span className={cn("font-mono text-sm text-muted-foreground transition-opacity duration-300", started ? "opacity-100" : "opacity-0")}>
                  {row.mark}
                </span>
                <div className="relative pl-6 text-[clamp(1.15rem,1.6vw,1.45rem)] leading-snug font-medium text-foreground">
                  {row.text != null ? (
                    <span>{row.text.slice(0, shown)}</span>
                  ) : (
                    <Corrected row={row} shown={shown} penDown={penDown} />
                  )}
                  {typing && <span className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] animate-pulse bg-ink" aria-hidden />}
                  {row.flag && shown === len && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-3 inline-flex translate-y-[-2px] items-center rounded-full bg-warning/15 px-2 py-0.5 align-middle font-mono text-xs font-semibold text-warning"
                    >
                      flagged
                    </motion.span>
                  )}
                  {row.flag && penDown && (
                    <motion.span
                      initial={{ opacity: 0, rotate: -12, scale: 0.6 }}
                      animate={{ opacity: 1, rotate: -6, scale: 1 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 16 }}
                      className="ml-3 inline-block font-hand text-3xl leading-none text-primary"
                    >
                      ✓ confirmed
                    </motion.span>
                  )}
                </div>
              </li>
            );
          })}
        </motion.ol>
      </AnimatePresence>

      <div className="mt-4 flex h-16 items-end justify-between gap-6 border-t border-ink/15 pt-4">
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Aa</span> Gemini&apos;s draft
          </span>
          <span className="flex items-center gap-2">
            <span className="font-hand text-2xl leading-none text-primary">Aa</span> Expert&apos;s pen
          </span>
        </div>
        <AnimatePresence>
          {(phase === "signed" || phase === "out") && (
            <motion.div key={page} className="flex flex-col items-end" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.span
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{ duration: 0.9, ease: "easeInOut" }}
                className="font-hand text-4xl leading-none text-primary"
              >
                {data.expert}
              </motion.span>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-1 font-mono text-xs text-muted-foreground">
                {data.role} · verified
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Corrected({ row, shown, penDown }) {
  const a = row.before.length;
  const b = a + row.wrong.length;
  return (
    <span>
      {row.before.slice(0, shown)}
      <span className="relative inline-block">
        <span className={cn("transition-colors duration-300", penDown && "text-foreground/40")}>{row.wrong.slice(0, Math.max(0, shown - a))}</span>
        {penDown && (
          <>
            <motion.span
              className="absolute top-1/2 -right-1 -left-1 h-[3px] origin-left -rotate-2 rounded-full bg-primary"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.35, ease: EASE }}
              aria-hidden
            />
            <motion.span
              className="absolute bottom-[78%] left-1/2 font-hand text-[1.6em] leading-none whitespace-nowrap text-primary"
              initial={{ opacity: 0, y: 8, x: "-50%", rotate: -4 }}
              animate={{ opacity: 1, y: 0, x: "-50%", rotate: -4 }}
              transition={{ delay: 0.35, duration: 0.45, ease: EASE }}
            >
              {row.fix}
            </motion.span>
          </>
        )}
      </span>
      {row.after.slice(0, Math.max(0, shown - b))}
    </span>
  );
}
