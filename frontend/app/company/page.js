"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, FolderPlus, Plus, TriangleAlert } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getCurrentUser, getDashboard, listGigs } from "@/lib/api";
import { formatMoney, formatPercent } from "@/lib/format";
import { SPECIALTY_META } from "@/lib/labels";

export default function CompanyGigsPage() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser("company");
      const gigs = user ? await listGigs(user.id) : [];
      const dashboards = await Promise.all(gigs.map((g) => getDashboard(g.id)));
      if (!cancelled) setRows(gigs.map((gig, i) => ({ gig, dashboard: dashboards[i] })));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer className="flex flex-col gap-8">
      <PageHeader
        title="My gigs"
        description="Every gig you've posted, with expert progress and how often reviewers agree."
        actions={
          <Button asChild size="lg" className="h-11 rounded-full px-5 text-[15px]">
            <Link href="/company/gigs/new">
              <Plus data-icon="inline-start" />
              Create gig
            </Link>
          </Button>
        }
      />

      {rows == null ? (
        <div className="grid gap-5 md:grid-cols-2" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="No gigs yet"
          description="Post a lab video and SOP. Gemini pre-segments it before experts start."
          action={
            <Button asChild className="mt-2 rounded-full">
              <Link href="/company/gigs/new">Create your first gig</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {rows.map(({ gig, dashboard }, i) => (
            <motion.div key={gig.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <GigCard gig={gig} dashboard={dashboard} />
            </motion.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function GigCard({ gig, dashboard }) {
  const total = dashboard?.total_tasks ?? 0;
  const resolved = dashboard?.tasks_by_status.resolved ?? 0;
  const flagged = dashboard?.flagged_items.length ?? 0;

  return (
    <Link
      href={`/company/gigs/${gig.id}`}
      className="group flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-lift transition-[translate,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Mono className="text-[13px] text-muted-foreground">{gig.id}</Mono>
          <h2 className="text-xl font-bold tracking-tight">{gig.title}</h2>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" aria-hidden />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <StatusBadge status={gig.status} />
        <span>{SPECIALTY_META[gig.required_specialty]?.name ?? gig.required_specialty}</span>
        <span aria-hidden>·</span>
        <span>{gig.sop_steps.length} SOP steps</span>
        <span aria-hidden>·</span>
        <Mono>{formatMoney(gig.pay_per_task)}</Mono>
        <span>/ task</span>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <Mono className="font-semibold text-foreground">{resolved}</Mono> of <Mono>{total}</Mono> tasks resolved
          </span>
          <span className="text-muted-foreground">
            Agreement <Mono className="font-semibold text-foreground">{formatPercent(dashboard?.agreement_rate, 0)}</Mono>
          </span>
        </div>
        <Progress value={total ? (resolved / total) * 100 : 0} className="h-2" />
      </div>

      {flagged > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-danger/8 px-3 py-2 text-sm font-medium text-danger">
          <TriangleAlert className="size-4" aria-hidden />
          {flagged} {flagged === 1 ? "task needs" : "tasks need"} adjudication
        </div>
      )}
    </Link>
  );
}
