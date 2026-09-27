"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Download, FileQuestion, Film, Scale, Sparkles } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import StatTile from "@/components/StatTile";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDashboard, getGig, listGigTasks } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { SPECIALTY_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

const STATUS_ORDER = ["resolved", "flagged", "submitted", "in_progress", "open"];
const STATUS_BAR = {
  resolved: "bg-success",
  flagged: "bg-danger",
  submitted: "bg-label-dispense",
  in_progress: "bg-warning",
  open: "bg-border-strong",
};
const STATUS_NAME = { resolved: "Resolved", flagged: "Flagged", submitted: "Submitted", in_progress: "In progress", open: "Open" };

export default function GigDashboardPage() {
  const { id } = useParams();
  const [data, setData] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const gig = await getGig(id);
      if (!gig) return !cancelled && setData({ status: "missing" });
      const [dashboard, tasks] = await Promise.all([getDashboard(id), listGigTasks(id)]);
      if (!cancelled) setData({ status: "ready", gig, dashboard, tasks });
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (data.status === "missing") {
    return (
      <PageContainer>
        <EmptyState icon={FileQuestion} title="Gig not found" description={`No gig with id ${id}.`} />
      </PageContainer>
    );
  }

  if (data.status === "loading") {
    return (
      <PageContainer className="flex flex-col gap-8" aria-busy="true">
        <div className="h-16 w-96 animate-pulse rounded-lg bg-card" />
        <div className="grid gap-5 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-card" />
      </PageContainer>
    );
  }

  const { gig, dashboard, tasks } = data;
  const counts = dashboard?.tasks_by_status ?? {};
  const total = dashboard?.total_tasks ?? tasks.length;
  const resolved = counts.resolved ?? 0;
  const flaggedItems = dashboard?.flagged_items ?? [];

  return (
    <PageContainer className="flex flex-col gap-8">
      <PageHeader
        eyebrow={
          <>
            <Link href="/company" className="hover:text-foreground">
              Gigs
            </Link>{" "}
            <span className="text-border-strong">/</span> {gig.id}
          </>
        }
        title={gig.title}
        meta={<StatusBadge status={gig.status} />}
        description={`${SPECIALTY_META[gig.required_specialty]?.name ?? gig.required_specialty} · ${gig.raters_required} experts per task · ${formatMoney(gig.pay_per_task)} per task`}
        actions={
          <Button asChild size="lg" variant="outline" className="h-11 rounded-full bg-card px-5 text-[15px]">
            <Link href={`/company/gigs/${gig.id}/export`}>
              <Download data-icon="inline-start" />
              Export dataset
            </Link>
          </Button>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Tasks" value={total} hint={`${resolved} resolved`} />
        <StatTile label="Progress" value={total ? Math.round((resolved / total) * 100) : 0} suffix="%" hint="Tasks with a final answer" />
        <StatTile
          label="Expert agreement"
          value={dashboard?.agreement_rate == null ? null : Math.round(dashboard.agreement_rate * 100)}
          suffix="%"
          hint="Segments both experts agree on"
          tone={dashboard?.agreement_rate != null && dashboard.agreement_rate >= 0.7 ? "success" : undefined}
        />
        <StatTile
          label="Needs adjudication"
          value={flaggedItems.length}
          hint={flaggedItems.length ? "Disagreements flagged" : "Nothing flagged"}
          tone={flaggedItems.length ? "danger" : undefined}
        />
      </div>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-7">
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-lift">
            <span className="text-lg font-bold">Task status</span>
            <div className="flex h-3 overflow-hidden rounded-full bg-secondary">
              {STATUS_ORDER.map((s) =>
                counts[s] ? (
                  <motion.div
                    key={s}
                    className={STATUS_BAR[s]}
                    initial={{ width: 0 }}
                    animate={{ width: `${(counts[s] / total) * 100}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                ) : null
              )}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {STATUS_ORDER.map((s) => (
                <span key={s} className="inline-flex items-center gap-2 text-muted-foreground">
                  <span className={cn("size-2.5 rounded-sm", STATUS_BAR[s])} aria-hidden />
                  {STATUS_NAME[s]}
                  <Mono className="font-semibold text-foreground">{counts[s] ?? 0}</Mono>
                </span>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <span className="text-lg font-bold">Tasks</span>
              <Mono className="text-sm text-muted-foreground">{tasks.length} {tasks.length === 1 ? "video" : "videos"}</Mono>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Task</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Experts</TableHead>
                  <TableHead>Gemini segments</TableHead>
                  <TableHead className="pr-6 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="pl-6">
                      <Mono className="font-semibold">{task.id}</Mono>
                    </TableCell>
                    <TableCell className="max-w-48">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Film className="size-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{(task.video_url ?? gig.video_url)?.split("/").pop() ?? "—"}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>
                      <Mono>
                        {task.assigned_rater_ids.length}/{gig.raters_required}
                      </Mono>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-gemini" aria-hidden />
                        <Mono>{task.ai_segments.length}</Mono>
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {task.status === "flagged" ? (
                        <Button asChild size="sm" className="rounded-full px-3">
                          <Link href={`/tasks/${task.id}/review`}>
                            Review
                            <ArrowRight data-icon="inline-end" />
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="ghost" className="rounded-full px-3">
                          <Link href={`/tasks/${task.id}`}>
                            Open
                            <ArrowRight data-icon="inline-end" />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </div>

        <aside className="flex flex-col gap-7">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <Scale className="size-5 text-danger" aria-hidden />
              <span className="text-lg font-bold">Flagged for review</span>
            </div>
            {flaggedItems.length === 0 ? (
              <p className="px-5 py-5 text-[15px] text-muted-foreground">No disagreements right now. Experts agree on every submitted task.</p>
            ) : (
              <ul className="divide-y divide-border">
                {flaggedItems.map((item) => (
                  <li key={item.task_id}>
                    <Link href={`/tasks/${item.task_id}/review`} className="group flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-secondary/50">
                      <div className="flex flex-1 flex-col gap-1">
                        <Mono className="text-sm font-semibold">{item.task_id}</Mono>
                        <span className="text-sm text-muted-foreground">{item.reason ?? `${item.disagreement_count} disagreements`}</span>
                      </div>
                      <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {dashboard?.ai_segments_accepted_rate != null && (
            <section className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary-soft/40 p-5">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-gemini">
                <Sparkles className="size-4" aria-hidden />
                Gemini pre-annotation
              </span>
              <p className="text-[15px] leading-relaxed">
                <Mono className="text-2xl font-semibold">{Math.round(dashboard.ai_segments_accepted_rate * 100)}%</Mono> of Gemini&apos;s segments were accepted by experts without edits.
              </p>
            </section>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
