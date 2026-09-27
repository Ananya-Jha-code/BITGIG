// MOCK: simulated payout flow. Local state only: nothing is sent anywhere and no money moves.
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, Bitcoin, Check, Globe, Landmark, Loader2, Wallet } from "lucide-react";
import Mono from "@/components/Mono";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const METHOD_ICONS = { bank: Landmark, paypal: Wallet, crypto: Bitcoin, wise: Globe };
const STAGES = ["Requested", "Processing", "Paid"];
const STAGE_MS = 1200;

export function feeFor(method, amount) {
  return Math.round((method.fee + amount * method.feePct) * 100) / 100;
}

// step: "choose" -> "review" -> "sending" (stage 0..2) -> "done"
export default function PayoutPanel({ balance, methods, currency, onPaid }) {
  const [methodId, setMethodId] = useState(methods[0].id);
  const [step, setStep] = useState("choose");
  const [stage, setStage] = useState(0);
  const method = methods.find((m) => m.id === methodId);
  const fee = feeFor(method, balance);

  useEffect(() => {
    if (step !== "sending") return;
    if (stage >= STAGES.length - 1) {
      const t = setTimeout(() => {
        setStep("done");
        onPaid({ method: method.id, amount: balance });
        toast.success("Payout sent", { description: `${formatMoney(balance - fee, currency)} to ${method.name}` });
      }, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage((s) => s + 1), STAGE_MS);
    return () => clearTimeout(t);
  }, [step, stage, method, balance, fee, currency, onPaid]);

  function start() {
    setStage(0);
    setStep("sending");
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-lift">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Available to withdraw</span>
          <Mono className="text-4xl font-semibold">{formatMoney(step === "done" ? 0 : balance, currency)}</Mono>
        </div>
        {step === "review" && (
          <Button variant="ghost" size="sm" onClick={() => setStep("choose")} className="rounded-full">
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === "choose" && (
          <motion.div key="choose" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
            <span className="text-sm font-semibold">Payout method</span>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label="Payout method">
              {methods.map((m) => {
                const Icon = METHOD_ICONS[m.id] ?? Wallet;
                const selected = m.id === methodId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setMethodId(m.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150",
                      selected ? "border-ink bg-elevated" : "border-border hover:border-border-strong"
                    )}
                  >
                    <span className={cn("flex size-9 items-center justify-center rounded-lg", selected ? "bg-ink text-white" : "bg-secondary")}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold">{m.name}</span>
                      <Mono className="truncate text-xs text-muted-foreground">{m.account}</Mono>
                    </span>
                    <span className="text-right text-xs text-muted-foreground">
                      {m.eta}
                      <br />
                      {feeFor(m, balance) ? `${formatMoney(feeFor(m, balance), currency)} fee` : "No fee"}
                    </span>
                  </button>
                );
              })}
            </div>
            <Button size="lg" onClick={() => setStep("review")} disabled={balance <= 0} className="h-11 rounded-full text-[15px]">
              Continue
            </Button>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div key="review" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-3 rounded-xl bg-secondary/60 p-4 text-sm">
              <dt className="text-muted-foreground">To</dt>
              <dd className="text-right font-semibold">{method.name}</dd>
              <dt className="text-muted-foreground">Account</dt>
              <dd className="truncate text-right font-mono">{method.account}</dd>
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="text-right font-mono">{formatMoney(balance, currency)}</dd>
              <dt className="text-muted-foreground">Fee</dt>
              <dd className="text-right font-mono">{formatMoney(fee, currency)}</dd>
              <dt className="border-t border-border-strong/60 pt-3 font-semibold">You receive</dt>
              <dd className="border-t border-border-strong/60 pt-3 text-right font-mono font-semibold">{formatMoney(balance - fee, currency)}</dd>
              <dt className="text-muted-foreground">Arrives</dt>
              <dd className="text-right">{method.eta}</dd>
            </dl>
            <Button size="lg" onClick={start} className="h-11 rounded-full text-[15px]">
              Confirm payout
            </Button>
          </motion.div>
        )}

        {(step === "sending" || step === "done") && (
          <motion.div key="sending" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4" aria-live="polite">
            <ol className="flex flex-col gap-3">
              {STAGES.map((label, i) => {
                const done = step === "done" || i < stage;
                const active = step === "sending" && i === stage;
                return (
                  <li key={label} className={cn("flex items-center gap-3 text-sm", !done && !active && "text-muted-foreground")}>
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border",
                        done ? "border-success bg-success text-white" : active ? "border-primary text-primary" : "border-border-strong"
                      )}
                    >
                      {done ? <Check className="size-3.5" strokeWidth={3} /> : active ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    </span>
                    <span className={cn(active && "font-semibold")}>{label}</span>
                  </li>
                );
              })}
            </ol>
            {step === "done" && (
              <p className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
                {formatMoney(balance - fee, currency)} sent to {method.name}.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
