"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Check, CheckCircle2, FileQuestion, Gavel, Scale, Sparkles, TriangleAlert } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import SegmentTimeline, { TimelineLegend } from "@/components/SegmentTimeline";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import Transport from "@/components/workspace/Transport";
import VideoPlayer from "@/components/workspace/VideoPlayer";
import { adjudicate, getAnnotations, getConsensus, getCurrentUser, getGig, getTask, getUser } from "@/lib/api";
import { formatPercent, formatTime, pad2 } from "@/lib/format";
import { ANOMALY_META, LABEL_META } from "@/lib/labels";
import { usePlayback } from "@/lib/usePlayback";
import { cn } from "@/lib/utils";

export default function ConsensusReviewPage() {
  const { id } = useParams();
  const [data, setData] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const task = await getTask(id);
      if (!task) return !cancelled && setData({ status: "missing" });
      const [gig, annotations, consensus, me] = await Promise.all([
        getGig(task.gig_id),
        getAnnotations(task.id),
        getConsensus(task.id),
        getCurrentUser("company"),
      ]);
      const raters = await Promise.all(annotations.map((a) => getUser(a.rater_id)));
      if (!cancelled) setData({ status: "ready", task, gig, annotations, consensus, raters, me });
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (data.status === "missing") {
    return (
      <PageContainer>
        <EmptyState icon={FileQuestion} title="Task not found" description={`No task with id ${id}.`} />
      </PageContainer>
    );
  }

  if (data.status === "loading") {
    return (
      <PageContainer wide className="flex flex-col gap-6 py-8 lg:px-10" aria-busy="true">
        <div className="h-14 w-96 animate-pulse rounded-lg bg-card" />
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="flex flex-col gap-7">
            <div className="aspect-16/7 animate-pulse rounded-2xl bg-card" />
            <div className="h-56 animate-pulse rounded-2xl bg-card" />
          </div>
          <div className="h-[560px] animate-pulse rounded-2xl bg-card" />
        </div>
      </PageContainer>
    );
  }

  if (!data.consensus || data.annotations.length < 2) {
    return (
      <PageContainer className="flex flex-col gap-8">
        <EmptyState
          icon={Scale}
          title="Consensus isn't ready"
          description="Both experts need to submit before their annotations can be compared."
          action={
            <Button asChild variant="outline" className="mt-2 rounded-full bg-card">
              <Link href={`/company/gigs/${data.task.gig_id}`}>Back to dashboard</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return <Review {...data} />;
}

function Review({ task, gig, annotations, consensus, raters, me }) {
  const router = useRouter();
  const [annA, annB] = annotations;
  const [raterA, raterB] = raters;
  const disagreements = consensus.disagreements;
  // segment_index -> "a" | "b": whose version goes into the final dataset.
  const [choices, setChoices] = useState({});
  const [active, setActive] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(task.status === "resolved");

  const allSegments = [...annA.segments, ...annB.segments];
  const fallbackDuration = Math.ceil(Math.max(...allSegments.map((s) => s.end)) + 1.5);
  const playback = usePlayback({ src: gig.video_url, fallbackDuration });
  const { time, duration, seek } = playback;

  const regions = disagreements.map((d) => regionFor(d, annA, annB));
  const flaggedIndices = disagreements.map((d) => d.segment_index);
  const decided = disagreements.filter((d) => choices[d.segment_index]).length;
  const atPlayhead = annA.segments.findIndex((s) => time >= s.start && time < s.end);

  function focus(i) {
    setActive(i);
    seek(regions[i].start);
  }

  function choose(segmentIndex, side) {
    setChoices((prev) => ({ ...prev, [segmentIndex]: side }));
  }

  async function resolve() {
    setResolving(true);
    try {
      // Start from rater A and swap in rater B's segment wherever the adjudicator sided with B.
      const segments = annA.segments.map((seg, i) => (choices[i] === "b" && annB.segments[i] ? annB.segments[i] : seg));
      await adjudicate(task.id, { actorId: me?.id, segments });
      setResolved(true);
      toast.success("Task resolved", { description: "The agreed annotation is now in the export." });
      router.push(`/company/gigs/${gig.id}`);
    } catch (err) {
      toast.error("Couldn't resolve the task", { description: err.message });
    } finally {
      setResolving(false);
    }
  }

  return (
    <PageContainer wide className="flex flex-col gap-7 py-8 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <Mono className="text-[13px] text-muted-foreground">
            <Link href={`/company/gigs/${gig.id}`} className="hover:text-foreground">
              {gig.title}
            </Link>{" "}
            <span className="text-border-strong">/</span> {task.id} <span className="text-border-strong">/</span> review
          </Mono>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Consensus review</h1>
            <StatusBadge status={resolved ? "resolved" : task.status} />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end leading-tight">
            <Mono className={cn("text-3xl font-semibold", consensus.agreement_score < 0.5 ? "text-danger" : "text-success")}>
              {formatPercent(consensus.agreement_score, 0)}
            </Mono>
            <span className="text-[13px] text-muted-foreground">agreement</span>
          </div>
          <Button size="lg" onClick={resolve} disabled={resolved || resolving || decided < disagreements.length} className="h-11 rounded-full px-5 text-[15px]">
            <Gavel data-icon="inline-start" />
            {resolved ? "Resolved" : resolving ? "Resolving…" : `Resolve (${decided}/${disagreements.length})`}
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-7">
          <div className="overflow-hidden rounded-2xl border border-border shadow-lift">
            <VideoPlayer
              playback={playback}
              fileName={gig.video_url?.split("/").pop() ?? "video.mp4"}
              segment={atPlayhead >= 0 ? annA.segments[atPlayhead] : null}
              segmentKey={atPlayhead}
              stepText={atPlayhead >= 0 ? gig.sop_steps[annA.segments[atPlayhead].sop_step] : null}
            />
            <Transport playback={playback} onPrev={() => focus(Math.max(0, (active ?? 1) - 1))} onNext={() => focus(Math.min(disagreements.length - 1, active == null ? 0 : active + 1))} />
          </div>

          <section className="rounded-2xl border border-border bg-card shadow-lift">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <span className="text-lg font-bold">Expert annotations</span>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-3 rounded-sm border-2 border-danger/70 bg-danger/10" aria-hidden />
                {disagreements.length} disagreements
              </span>
            </div>
            <div className="flex flex-col gap-5 p-5">
              <SegmentTimeline
                duration={duration}
                currentTime={time}
                onSeek={seek}
                regions={regions}
                lanes={[
                  { id: "a", title: raterA?.name ?? "Rater A", subtitle: "Rater A", segments: annA.segments, flaggedIndices },
                  { id: "b", title: raterB?.name ?? "Rater B", subtitle: "Rater B", segments: annB.segments, flaggedIndices },
                ]}
              />
              <TimelineLegend className="border-t border-border pt-4" />
            </div>
          </section>

          {consensus.ai_explanation && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="gemini-glow overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-lift"
            >
              <div className="flex items-center gap-3 border-b border-primary/15 bg-primary-soft/50 px-5 py-4">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
                  <Sparkles className="size-4" aria-hidden />
                </span>
                <span className="text-lg font-bold">Why the experts disagree</span>
                <GeminiChip size="xs" className="ml-auto">
                  explain_disagreement
                </GeminiChip>
              </div>
              <p className="px-5 py-5 text-[15px] leading-relaxed">{consensus.ai_explanation}</p>
            </motion.section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Adjudicate</span>
            <span className="text-sm text-muted-foreground">Pick the correct version of each</span>
          </div>
          {disagreements.map((d, i) => (
            <DisagreementCard
              key={i}
              disagreement={d}
              segA={annA.segments[d.segment_index]}
              segB={annB.segments[d.segment_index]}
              nameA={raterA?.name ?? "Rater A"}
              nameB={raterB?.name ?? "Rater B"}
              active={active === i}
              choice={choices[d.segment_index]}
              disabled={resolved}
              onFocus={() => focus(i)}
              onChoose={(side) => choose(d.segment_index, side)}
            />
          ))}
          {decided === disagreements.length && !resolved && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" aria-hidden />
              Every disagreement has a decision. Resolve to finalize.
            </motion.p>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}

// The time window a disagreement covers, across both raters' versions of the segment.
function regionFor(d, annA, annB) {
  const segs = [annA.segments[d.segment_index], annB.segments[d.segment_index]].filter(Boolean);
  return { start: Math.min(...segs.map((s) => s.start)), end: Math.max(...segs.map((s) => s.end)) };
}

function DisagreementCard({ disagreement, segA, segB, nameA, nameB, active, choice, disabled, onFocus, onChoose }) {
  const Icon = disagreement.type === "anomaly" ? TriangleAlert : Scale;
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-lift transition-colors duration-150",
        active ? "border-ink" : "border-border",
        choice && "border-success/50"
      )}
    >
      <button type="button" onClick={onFocus} className="flex items-start gap-3 text-left">
        <Icon className={cn("mt-0.5 size-5 shrink-0", disagreement.type === "anomaly" ? "text-warning" : "text-danger")} aria-hidden />
        <div className="flex flex-1 flex-col gap-1">
          <span className="flex items-center gap-2">
            <Mono className="text-sm font-semibold">SEG {pad2(disagreement.segment_index + 1)}</Mono>
            <span className="text-sm font-semibold capitalize">{disagreement.type}</span>
          </span>
          <span className="text-sm text-muted-foreground">{disagreement.reason}</span>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-3">
        <Option name={nameA} seg={segA} other={segB} selected={choice === "a"} disabled={disabled} onClick={() => onChoose("a")} />
        <Option name={nameB} seg={segB} other={segA} selected={choice === "b"} disabled={disabled} onClick={() => onChoose("b")} />
      </div>
    </section>
  );
}

function Option({ name, seg, other, selected, disabled, onClick }) {
  if (!seg) {
    return <div className="flex items-center justify-center rounded-xl border border-dashed border-border-strong p-3 text-sm text-muted-foreground">No segment</div>;
  }
  const meta = LABEL_META[seg.label] ?? LABEL_META.other;
  // Highlight the values that differ from the other rater.
  const diff = (field) => other && other[field] !== seg[field];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3 text-left transition-colors duration-150 disabled:cursor-not-allowed",
        selected ? "border-success bg-success/8" : "border-border hover:border-border-strong hover:bg-secondary/40"
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-semibold">{name}</span>
        {selected && <Check className="size-4 shrink-0 text-success" strokeWidth={3} aria-hidden />}
      </span>
      <span className={cn("inline-flex items-center gap-1.5 text-sm", diff("label") && "font-semibold")}>
        <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
        {meta.name}
      </span>
      <Mono className={cn("text-xs", diff("start") || diff("end") ? "font-semibold text-danger" : "text-muted-foreground")}>
        {formatTime(seg.start)}–{formatTime(seg.end)}
      </Mono>
      <span className={cn("text-xs", diff("anomaly") || diff("success") ? "font-semibold text-danger" : "text-muted-foreground")}>
        {seg.anomaly ? ANOMALY_META[seg.anomaly]?.name ?? seg.anomaly : "No anomaly"} · {seg.success ? "success" : "failed"}
      </span>
    </button>
  );
}
