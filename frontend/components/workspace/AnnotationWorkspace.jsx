"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { History, Send } from "lucide-react";
import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import SegmentTimeline, { TimelineLegend } from "@/components/SegmentTimeline";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import GeminiNotes from "@/components/workspace/GeminiNotes";
import SegmentInspector from "@/components/workspace/SegmentInspector";
import SopPanel from "@/components/workspace/SopPanel";
import Transport from "@/components/workspace/Transport";
import VideoPlayer from "@/components/workspace/VideoPlayer";
import { saveAnnotation } from "@/lib/api";
import { pad2 } from "@/lib/format";
import { usePlayback } from "@/lib/usePlayback";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 0.2;

export default function AnnotationWorkspace({ task, gig, issues, raterId }) {
  const router = useRouter();
  const original = task.ai_segments;
  const [segments, setSegments] = useState(() => original.map((s) => ({ ...s })));
  const [selected, setSelected] = useState(null);
  const [reviewed, setReviewed] = useState(() => new Set());
  const [edits, setEdits] = useState([]);
  const [saving, setSaving] = useState(null);

  const fallbackDuration = Math.ceil(Math.max(...original.map((s) => s.end)) + 1.5);
  const videoUrl = task.video_url ?? gig.video_url;
  const playback = usePlayback({ src: videoUrl, fallbackDuration });
  const { time, duration, seek, togglePlay } = playback;
  const fileName = videoUrl?.split("/").pop() ?? "video.mp4";

  const atPlayhead = segments.findIndex((s) => time >= s.start && time < s.end);
  const activeStep = atPlayhead >= 0 ? segments[atPlayhead].sop_step : null;
  const allReviewed = reviewed.size === segments.length;

  const selectSegment = useCallback(
    (i) => {
      if (i < 0 || i >= segments.length) return;
      setSelected(i);
      seek(segments[i].start);
    },
    [segments, seek]
  );

  function markEdited(i, patch, entry) {
    setSegments((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
    setReviewed((prev) => {
      const next = new Set(prev);
      next.delete(i);
      return next;
    });
    setEdits((prev) => {
      const last = prev[prev.length - 1];
      // Consecutive edits to one field collapse into one audit entry.
      if (last && last.segment === i && last.field === entry.field && entry.field !== "revert") {
        return [...prev.slice(0, -1), { ...last, after: entry.after, at: new Date().toISOString() }];
      }
      return [...prev, { ...entry, segment: i, at: new Date().toISOString() }];
    });
  }

  function updateSegment(field, value) {
    const seg = segments[selected];
    let next = value;
    if (field === "start") next = Math.min(Math.max(0, value), seg.end - MIN_LENGTH);
    if (field === "end") next = Math.max(Math.min(duration, value), seg.start + MIN_LENGTH);
    if (seg[field] === next) return;
    markEdited(selected, { [field]: next, edited: true }, { field, before: seg[field], after: next });
  }

  function revertSegment() {
    markEdited(selected, { ...original[selected] }, { field: "revert", before: "edited", after: "gemini" });
  }

  const confirmSegment = useCallback(() => {
    if (selected == null) return;
    const next = new Set(reviewed).add(selected);
    setReviewed(next);
    if (next.size === segments.length) {
      toast.success("All segments reviewed", { description: "Submit when you're ready. Consensus runs once both experts finish." });
      return;
    }
    const upcoming = segments.findIndex((_, j) => j > selected && !next.has(j));
    const fallback = segments.findIndex((_, j) => !next.has(j));
    selectSegment(upcoming >= 0 ? upcoming : fallback);
  }, [selected, reviewed, segments, selectSegment]);

  async function save(submit) {
    setSaving(submit ? "submit" : "draft");
    try {
      await saveAnnotation(task.id, { raterId, segments, submit });
      if (submit) {
        toast.success("Submitted for consensus", { description: "You'll be paid once the task resolves." });
        router.push("/tasks");
      } else {
        toast.success("Draft saved", { description: `${edits.length} edits written to the audit log.` });
      }
    } finally {
      setSaving(null);
    }
  }

  useEffect(() => {
    function onKey(e) {
      const el = e.target;
      if (el.closest?.("input, textarea, select, [role='combobox'], [role='listbox'], [contenteditable='true']")) return;
      if (e.key === " " && el.tagName !== "BUTTON") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seek(time - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seek(time + 1);
      } else if (e.key === "[") {
        selectSegment((selected ?? 1) - 1);
      } else if (e.key === "]") {
        selectSegment(selected == null ? 0 : selected + 1);
      } else if (e.key === "Enter" && el.tagName !== "BUTTON") {
        confirmSegment();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seek, time, selected, selectSegment, confirmSegment]);

  const lastEdit = edits[edits.length - 1];
  const editedCount = segments.filter((s) => s.edited).length;

  return (
    <PageContainer wide className="flex flex-col gap-7 py-8 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <Mono className="text-[13px] text-muted-foreground">
            Marketplace <span className="text-border-strong">/</span> {task.id}
          </Mono>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{gig.title}</h1>
            <StatusBadge status={task.status} />
            <GeminiChip>Pre-annotated</GeminiChip>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ProgressRing done={reviewed.size} total={segments.length} />
          <Button variant="outline" size="lg" onClick={() => save(false)} disabled={saving !== null} className="h-11 rounded-full bg-card px-5 text-[15px]">
            {saving === "draft" ? "Saving…" : "Save draft"}
          </Button>
          <Button
            size="lg"
            onClick={() => save(true)}
            disabled={saving !== null}
            className={cn("h-11 rounded-full px-5 text-[15px] transition-shadow duration-300", allReviewed && "shadow-[0_0_0_4px_rgba(214,36,122,0.18)]")}
          >
            <Send data-icon="inline-start" />
            {saving === "submit" ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-7">
          <div className="overflow-hidden rounded-2xl border border-border shadow-lift">
            <VideoPlayer
              playback={playback}
              fileName={fileName}
              segment={atPlayhead >= 0 ? segments[atPlayhead] : null}
              segmentKey={atPlayhead}
              stepText={activeStep != null ? gig.sop_steps[activeStep] : null}
            />
            <Transport playback={playback} onPrev={() => selectSegment((selected ?? 1) - 1)} onNext={() => selectSegment(selected == null ? 0 : selected + 1)} />
          </div>

          <section className="rounded-2xl border border-border bg-card shadow-lift">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-baseline gap-3">
                <span className="text-lg font-bold">Timeline</span>
                <Mono className="text-sm text-muted-foreground">
                  {segments.length} segments · {editedCount} corrected
                </Mono>
              </div>
              <motion.div key={edits.length} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-muted-foreground">
                <History className="size-4" aria-hidden />
                {lastEdit ? (
                  <span>
                    <Mono className="font-semibold text-foreground">{edits.length}</Mono> {edits.length === 1 ? "edit" : "edits"} logged · last{" "}
                    <Mono className="text-foreground">
                      seg {pad2(lastEdit.segment + 1)}.{lastEdit.field}
                    </Mono>
                  </span>
                ) : (
                  <span>Every edit is audit-logged</span>
                )}
              </motion.div>
            </div>
            <div className="flex flex-col gap-5 p-5">
              <SegmentTimeline
                duration={duration}
                currentTime={time}
                onSeek={seek}
                lanes={[
                  { id: "draft", title: "Gemini draft", subtitle: "original", segments: original, compact: true },
                  {
                    id: "mine",
                    title: "Your annotation",
                    subtitle: "click to review",
                    segments,
                    selectedIndex: selected,
                    onSelect: selectSegment,
                    reviewedIndices: [...reviewed],
                  },
                ]}
              />
              <TimelineLegend className="border-t border-border pt-4" />
            </div>
          </section>

          <GeminiNotes issues={issues} onSelect={selectSegment} />
        </div>

        <aside className="flex flex-col gap-7">
          <SegmentInspector
            index={selected}
            segment={selected != null ? segments[selected] : null}
            total={segments.length}
            reviewed={selected != null && reviewed.has(selected)}
            isLast={reviewed.size >= segments.length - 1}
            sopSteps={gig.sop_steps}
            currentTime={time}
            onChange={updateSegment}
            onRevert={revertSegment}
            onConfirm={confirmSegment}
          />
          <SopPanel steps={gig.sop_steps} segments={segments} reviewed={reviewed} activeStep={activeStep} onJump={selectSegment} />
        </aside>
      </div>
    </PageContainer>
  );
}

function ProgressRing({ done, total }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const complete = done === total;
  return (
    <div className="flex items-center gap-3">
      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--secondary)" strokeWidth="4" />
        <motion.circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={complete ? "var(--success)" : "var(--primary)"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c * (1 - done / total) }}
          initial={{ strokeDashoffset: c }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="flex flex-col leading-tight">
        <Mono className="text-base font-semibold">
          {done}/{total}
        </Mono>
        <span className="text-[13px] text-muted-foreground">reviewed</span>
      </div>
    </div>
  );
}
