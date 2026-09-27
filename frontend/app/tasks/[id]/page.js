"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileQuestion } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import PageContainer from "@/components/PageContainer";
import AnnotationWorkspace from "@/components/workspace/AnnotationWorkspace";
import { checkAnnotation, getCurrentUser, getGig, getTask } from "@/lib/api";

export default function TaskWorkspacePage() {
  const { id } = useParams();
  const [data, setData] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const task = await getTask(id);
      if (!task) return !cancelled && setData({ status: "missing" });
      const [gig, user] = await Promise.all([getGig(task.gig_id), getCurrentUser("expert")]);
      const issues = await checkAnnotation(task.id, gig.id, task.ai_segments);
      if (!cancelled) setData({ status: "ready", task, gig, issues, raterId: user?.id });
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

  if (data.status === "loading") return <WorkspaceSkeleton />;

  return <AnnotationWorkspace task={data.task} gig={data.gig} issues={data.issues} raterId={data.raterId} />;
}

function WorkspaceSkeleton() {
  return (
    <PageContainer wide className="flex flex-col gap-6 py-6" aria-busy="true">
      <div className="h-14 w-96 animate-pulse rounded-lg bg-card" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-6">
          <div className="aspect-video animate-pulse rounded-xl bg-card" />
          <div className="h-44 animate-pulse rounded-xl bg-card" />
        </div>
        <div className="h-[520px] animate-pulse rounded-xl bg-card" />
      </div>
    </PageContainer>
  );
}
