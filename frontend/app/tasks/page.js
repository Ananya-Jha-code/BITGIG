"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Dna, Inbox, Microscope, Sparkles, Users, Video } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { getCurrentUser, listTasks } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { SPECIALTY_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

// Data types that exist only as static previews (see CLAUDE.md scope).
const PREVIEWS = [
  { href: "/preview/pathology", icon: Microscope, title: "Pathology slides", description: "Region annotation on whole-slide images", specialty: "Pathologist" },
  { href: "/preview/variant", icon: Dna, title: "Variant classification", description: "ACMG-style calls with Gemini evidence", specialty: "Geneticist" },
];

export default function MarketplacePage() {
  const [user, setUser] = useState(null);
  const [specialty, setSpecialty] = useState(null);
  const [tasks, setTasks] = useState(null);

  useEffect(() => {
    getCurrentUser("expert").then((u) => {
      setUser(u);
      setSpecialty(u?.specialty ?? "all");
    });
  }, []);

  useEffect(() => {
    if (specialty == null) return;
    let cancelled = false;
    listTasks(specialty === "all" ? undefined : specialty).then((t) => {
      if (!cancelled) setTasks(t);
    });
    return () => {
      cancelled = true;
    };
  }, [specialty]);

  const filters = ["all", ...Object.keys(SPECIALTY_META)];

  return (
    <PageContainer className="flex flex-col gap-8">
      <PageHeader
        title="Task marketplace"
        description="Open annotation tasks for verified specialists. Gemini has already drafted every segment, so you're correcting, not starting from zero."
        meta={<GeminiChip>Pre-annotated</GeminiChip>}
      />

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter by specialty">
        {filters.map((key) => {
          const active = specialty === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTasks(null);
                setSpecialty(key);
              }}
              className={cn(
                "h-9 rounded-full border px-4 text-sm font-medium transition-colors duration-150",
                active ? "border-ink bg-ink text-white" : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
              )}
            >
              {key === "all" ? "All specialties" : SPECIALTY_META[key].name}
              {key === user?.specialty && <span className="ml-1.5 text-xs opacity-70">(you)</span>}
            </button>
          );
        })}
      </div>

      {tasks == null ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState icon={Inbox} title="No open tasks here" description="Try another specialty, or check back once companies post new gigs." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task, i) => (
            <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <TaskCard task={task} userId={user?.id} />
            </motion.div>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold">More specialties</span>
          <span className="text-sm text-muted-foreground">Purpose-built annotation tools for pathology and genomics.</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {PREVIEWS.map(({ href, icon: Icon, title, description, specialty: who }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-2xl border border-dashed border-border-strong bg-card/60 p-5 transition-colors duration-150 hover:border-solid hover:bg-card"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-beige">
                <Icon className="size-5 text-[#5a4410]" aria-hidden />
              </span>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="font-semibold">{title}</span>
                <span className="text-sm text-muted-foreground">
                  {description} · {who}
                </span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}

function TaskCard({ task, userId }) {
  const gig = task.gig;
  const assigned = task.assigned_rater_ids.includes(userId);
  const slotsLeft = Math.max(0, gig.raters_required - task.assigned_rater_ids.length);

  return (
    <div className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">
          <Video className="size-5" aria-hidden />
        </span>
        <StatusBadge status={task.status} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Mono className="text-[13px] text-muted-foreground">{task.id}</Mono>
        <h2 className="text-lg leading-snug font-bold tracking-tight">{gig.title}</h2>
      </div>

      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Sparkles className="size-3.5 text-gemini" aria-hidden />
          Gemini segments
        </dt>
        <dd className="text-right font-mono font-semibold">{task.ai_segments.length}</dd>
        <dt className="text-muted-foreground">SOP steps</dt>
        <dd className="text-right font-mono font-semibold">{gig.sop_steps.length}</dd>
        <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Users className="size-3.5" aria-hidden />
          Expert slots
        </dt>
        <dd className="text-right font-mono font-semibold">{assigned ? "yours" : `${slotsLeft} open`}</dd>
      </dl>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <span>
          <Mono className="text-xl font-semibold">{formatMoney(gig.pay_per_task)}</Mono>
          <span className="text-sm text-muted-foreground"> / task</span>
        </span>
        <Button asChild className="h-10 rounded-full px-4">
          <Link href={`/tasks/${task.id}`}>
            {assigned ? "Continue" : "Start"}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
