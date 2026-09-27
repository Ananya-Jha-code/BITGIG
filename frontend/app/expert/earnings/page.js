// MOCK: earnings and payouts use mocks/earnings.js. The payout flow is simulated; no money moves.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Wallet } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import PayoutPanel from "@/components/earnings/PayoutPanel";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import StatTile from "@/components/StatTile";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCurrentUser, getEarnings } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { payoutMethods } from "@/mocks/earnings";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function EarningsPage() {
  const [data, setData] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser("expert");
      const earnings = user ? await getEarnings(user.id) : null;
      if (!cancelled) setData({ status: "ready", user, earnings });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [payouts, setPayouts] = useState([]);

  const { user, earnings } = data;
  const history = [...payouts, ...(earnings?.payout_history ?? [])];

  const handlePaid = useCallback(({ method, amount }) => {
    setPayouts((prev) => [{ id: `po_${Date.now()}`, method, amount, status: "paid", requested_at: new Date().toISOString() }, ...prev]);
  }, []);
  const currency = earnings?.currency ?? "USD";
  const average = earnings?.tasks_completed ? earnings.total_earned / earnings.tasks_completed : null;

  return (
    <PageContainer className="flex flex-col gap-8">
      <PageHeader
        eyebrow={user ? <Mono>{user.id}</Mono> : "expert"}
        title="Earnings"
        description="What you've earned from submitted tasks, and where it gets paid out."
        meta={user && <VerifiedBadge status={user.credential_status} />}
      />

      {data.status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-card" />
          ))}
        </div>
      ) : !earnings ? (
        <EmptyState icon={Wallet} title="No earnings yet" description="Complete a task from the marketplace to see it here." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Tasks completed" value={earnings.tasks_completed} />
            <StatTile label="Total earned" value={earnings.total_earned} suffix={currency} />
            <StatTile
              label="Average per task"
              value={average == null ? null : Math.round(average * 100) / 100}
              suffix={currency}
            />
          </div>

          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="flex min-w-0 flex-col gap-7">
              <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
                <div className="flex items-baseline justify-between border-b border-border px-6 py-4">
                  <h2 className="text-lg font-bold tracking-tight">Recently completed</h2>
                  <span className="text-sm text-muted-foreground">
                    <Mono>{earnings.recent.length}</Mono> tasks
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Gig</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="pr-6 text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.recent.map((row) => (
                      <TableRow key={row.task_id}>
                        <TableCell className="pl-6 font-medium">{row.gig_title}</TableCell>
                        <TableCell>
                          <Mono className="text-muted-foreground">{row.task_id}</Mono>
                        </TableCell>
                        <TableCell>
                          <Mono className="text-muted-foreground">{formatDate(row.completed_at)}</Mono>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Mono className="font-semibold">{formatMoney(row.amount, currency)}</Mono>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>

              <PayoutHistory history={history} currency={currency} />
            </div>

            <PayoutPanel
              balance={earnings.available_balance ?? 0}
              methods={payoutMethods}
              currency={currency}
              onPaid={handlePaid}
            />
          </div>
        </>
      )}
    </PageContainer>
  );
}

function PayoutHistory({ history, currency }) {
  const methodName = (id) => payoutMethods.find((m) => m.id === id)?.name ?? id;
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
      <div className="flex items-baseline justify-between border-b border-border px-6 py-4">
        <h2 className="text-lg font-bold tracking-tight">Payout history</h2>
        <span className="text-sm text-muted-foreground">
          <Mono>{history.length}</Mono> payouts
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Payout</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-6 text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="pl-6">
                <Mono className="text-muted-foreground">{p.id}</Mono>
              </TableCell>
              <TableCell className="font-medium">{methodName(p.method)}</TableCell>
              <TableCell>
                <Mono className="text-muted-foreground">{formatDate(p.requested_at)}</Mono>
              </TableCell>
              <TableCell>
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[13px] font-semibold text-success">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  Paid
                </span>
              </TableCell>
              <TableCell className="pr-6 text-right">
                <Mono className="font-semibold">{formatMoney(p.amount, currency)}</Mono>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
