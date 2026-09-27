"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Database, Download, FileQuestion, ShieldCheck } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import StatTile from "@/components/StatTile";
import { Button } from "@/components/ui/button";
import { exportGig, getGig } from "@/lib/api";

export default function ExportPage() {
  const { id } = useParams();
  const [data, setData] = useState({ status: "loading" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const gig = await getGig(id);
      if (!gig) return !cancelled && setData({ status: "missing" });
      const dataset = await exportGig(id);
      if (!cancelled) setData({ status: "ready", gig, dataset });
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
        <div className="h-96 animate-pulse rounded-2xl bg-card" />
      </PageContainer>
    );
  }

  const { gig, dataset } = data;
  const exportTasks = dataset.tasks ?? [];
  const segmentCount = exportTasks.reduce((n, t) => n + t.segments.length, 0);
  const editedCount = exportTasks.reduce((n, t) => n + t.segments.filter((s) => s.edited).length, 0);
  const json = JSON.stringify({ gig: { id: gig.id, title: gig.title, sop_steps: gig.sop_steps, label_schema: gig.label_schema }, ...dataset }, null, 2);
  const fileName = `${gig.id}_annotations.json`;

  function download() {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dataset downloaded", { description: fileName });
  }

  async function copy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <PageContainer className="flex flex-col gap-8">
      <PageHeader
        eyebrow={
          <>
            <Link href="/company" className="hover:text-foreground">
              Gigs
            </Link>{" "}
            <span className="text-border-strong">/</span>{" "}
            <Link href={`/company/gigs/${gig.id}`} className="hover:text-foreground">
              {gig.id}
            </Link>{" "}
            <span className="text-border-strong">/</span> export
          </>
        }
        title="Export dataset"
        description={`Final, expert-agreed annotations for ${gig.title}. Only resolved tasks are included.`}
        actions={
          <Button size="lg" onClick={download} disabled={exportTasks.length === 0} className="h-11 rounded-full px-5 text-[15px]">
            <Download data-icon="inline-start" />
            Download JSON
          </Button>
        }
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <StatTile label="Resolved tasks" value={exportTasks.length} />
        <StatTile label="Segments" value={segmentCount} />
        <StatTile label="Expert corrections" value={editedCount} hint="Gemini segments an expert changed" />
      </div>

      {exportTasks.length === 0 ? (
        <EmptyState
          icon={Database}
          title="Nothing to export yet"
          description="Tasks appear here once both experts agree or a flagged task is adjudicated."
          action={
            <Button asChild variant="outline" className="mt-2 rounded-full bg-card">
              <Link href={`/company/gigs/${gig.id}`}>Back to dashboard</Link>
            </Button>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <Mono className="text-sm font-semibold">{fileName}</Mono>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <ShieldCheck className="size-4 text-success" aria-hidden />
                Every change is backed by the audit log
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={copy} className="rounded-full">
              {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="max-h-[560px] overflow-auto bg-ink p-5 font-mono text-[13px] leading-relaxed text-white/90">{json}</pre>
        </section>
      )}
    </PageContainer>
  );
}
