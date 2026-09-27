"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History, Send } from "lucide-react";
import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import SegmentTimeline, { TimelineLegend } from "@/components/SegmentTimeline";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import GeminiNotes from "@/components/workspace/GeminiNotes";
import SegmentInspector from "@/components/workspace/SegmentInspector";
import SopPanel from "@/components/workspace/SopPanel";
import Transport from "@/components/workspace/Transport";
import VideoPlayer from "@/components/workspace/VideoPlayer";
import { saveAnnotation } from "@/lib/api";
import { usePlayback } from "@/lib/usePlayback";

const MIN_LENGTH = 0.2;

export default function AnnotationWorkspace({ task, gig, issues, raterId }) {
  const router = useRouter();
  const original = task.ai_segments;
  const [segments, setSegments] = useState(() => original.map((s) => ({ ...s })));
  const [selected, setSelected] = useState(null);
  const [edits, setEdits] = useState([]);
  const [saving, setSaving] = useState(null);

  const fallbackDuration = Math.ceil(Math.max(...original.map((s) => s.end)) + 1.5);
  const playback = usePlayback({ src: gig.video_url, fallbackDuration });
  const { time, duration, seek, togglePlay } = playback;
  const fileName = gig.video_url?.split("/").pop() ?? "video.mp4";

  const atPlayhead = segments.findIndex((s) => time >= s.start && time < s.end);
  const activeStep = atPlayhead >= 0 ? segments[atPlayhead].sop_step : null;

  const selectSegment = useCallback(
    (i) => {
      if (i < 0 || i >= segments.length) return;
      setSelected(i);
      seek(segments[i].start);
    },
    [segments, seek]
  );

  function updateSegment(field, value) {
    const i = selected;
    const seg = segments[i];
    let next = value;
    if (field === "start") next = Math.min(Math.max(0, value), seg.end - MIN_LENGTH);
    if (field === "end") next = Math.max(Math.min(duration, value), seg.start + MIN_LENGTH);
    if (seg[field] === next) return;

    setSegments((prev) => prev.map((s, j) => (j === i ? { ...s, [field]: next, edited: true } : s)));
    // Audit trail, mirrored server-side on save. Consecutive edits to one field collapse into one entry.
    setEdits((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.segment === i && last.field === field) {
        return [...prev.slice(0, -1), { ...last, after: next, at: new Date().toISOString() }];
      }
      return [...prev, { segment: i, field, before: seg[field], after: next, at: new Date().toISOString() }];
    });
  }

  function revertSegment() {
    const i = selected;
    setSegments((prev) => prev.map((s, j) => (j === i ? { ...original[i] } : s)));
    setEdits((prev) => [...prev, { segment: i, field: "revert", before: "edited", after: "gemini", at: new Date().toISOString() }]);
  }

  async function save(submit) {
    setSaving(submit ? "submit" : "draft");
    try {
      await saveAnnotation(task.id, { raterId, segments, submit });
      if (submit) {
        toast.success("Annotation submitted", { description: "Consensus runs once every assigned expert has submitted." });
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
        selectSegment((selected ?? atPlayhead ?? 0) - 1);
      } else if (e.key === "]") {
        selectSegment((selected ?? atPlayhead) + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seek, time, selected, atPlayhead, selectSegment]);

  const editedCount = useMemo(() => segments.filter((s) => s.edited).length, [segments]);
  const lastEdit = edits[edits.length - 1];

  return (
    <PageContainer wide className="flex flex-col gap-6 py-6">
      <PageHeader
        eyebrow={
          <span>
            {gig.title} <span className="text-border">/</span> {task.id}
          </span>
        }
        title="Review Gemini's segmentation"
        meta={
          <>
            <StatusBadge status={task.status} />
            <GeminiChip size="xs">Pre-annotated</GeminiChip>
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => save(false)} disabled={saving !== null}>
              {saving === "draft" ? "Saving…" : "Save draft"}
            </Button>
            <Button onClick={() => save(true)} disabled={saving !== null}>
              <Send data-icon="inline-start" />
              {saving === "submit" ? "Submitting…" : "Submit for consensus"}
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="overflow-hidden rounded-xl border border-border">
            <VideoPlayer
              playback={playback}
              fileName={fileName}
              segment={atPlayhead >= 0 ? segments[atPlayhead] : null}
              stepText={activeStep != null ? gig.sop_steps[activeStep] : null}
            />
            <Transport
              playback={playback}
              onPrev={() => selectSegment((selected ?? atPlayhead ?? 0) - 1)}
              onNext={() => selectSegment((selected ?? atPlayhead) + 1)}
            />
          </div>

          <section className="rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-sm font-medium">Timeline</h2>
                <Mono className="text-xs text-muted-foreground">
                  {segments.length} segments · {editedCount} edited
                </Mono>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <History className="size-3.5" aria-hidden />
                {lastEdit ? (
                  <span>
                    <Mono className="text-foreground/80">{edits.length}</Mono> edits logged · last{" "}
                    <Mono>
                      SEG {String(lastEdit.segment + 1).padStart(2, "0")}.{lastEdit.field}
                    </Mono>
                  </span>
                ) : (
                  <span>Every edit is written to the audit log</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4 p-4">
              <SegmentTimeline
                duration={duration}
                currentTime={time}
                onSeek={seek}
                lanes={[
                  { id: "draft", title: "Gemini draft", subtitle: "reference", segments: original, compact: true },
                  {
                    id: "mine",
                    title: "Your annotation",
                    subtitle: "click a segment to edit",
                    segments,
                    selectedIndex: selected,
                    onSelect: selectSegment,
                  },
                ]}
              />
              <TimelineLegend className="border-t border-border pt-3" />
            </div>
          </section>

          <GeminiNotes issues={issues} onSelect={selectSegment} />
        </div>

        <aside className="flex flex-col gap-6">
          <SegmentInspector
            index={selected}
            segment={selected != null ? segments[selected] : null}
            total={segments.length}
            sopSteps={gig.sop_steps}
            currentTime={time}
            onChange={updateSegment}
            onRevert={revertSegment}
          />
          <SopPanel
            steps={gig.sop_steps}
            segments={segments}
            currentTime={time}
            activeStep={activeStep}
            onJump={selectSegment}
          />
        </aside>
      </div>
    </PageContainer>
  );
}
