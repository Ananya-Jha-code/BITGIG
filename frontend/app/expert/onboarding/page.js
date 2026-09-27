// MOCK: credential onboarding is static UI with sample data (mocks/credentials.js). Nothing is uploaded or verified.
"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, FileText, Upload } from "lucide-react";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentUser } from "@/lib/api";
import { SPECIALTY_META } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { VERIFICATION_STEPS, credentialsByExpert } from "@/mocks/credentials";

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
}

export default function OnboardingPage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ specialty: "", license: "", fileName: "" });
  const fileInput = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser("expert").then((u) => {
      if (cancelled || !u) return;
      const saved = credentialsByExpert[u.id];
      setUser(u);
      setForm({
        specialty: saved?.specialty ?? u.specialty ?? "",
        license: saved?.license_number ?? "",
        fileName: saved?.document_name ?? "",
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const saved = user ? credentialsByExpert[user.id] : null;

  function onSubmit(e) {
    e.preventDefault();
    toast.success("Credentials submitted", { description: "Our review team usually verifies documents within 24 hours." });
  }

  return (
    <PageContainer className="flex flex-col gap-8">
      <PageHeader
        eyebrow={user ? <Mono>{user.id}</Mono> : "expert"}
        title="Credentials"
        description="Verify your specialty to unlock matching tasks."
        meta={user && <VerifiedBadge status={user.credential_status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={onSubmit} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-bold tracking-tight">Your credentials</h2>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2.5">
              <Label htmlFor="specialty" className="text-sm font-semibold text-muted-foreground">Specialty</Label>
              <Select value={form.specialty} onValueChange={(v) => set("specialty", v)}>
                <SelectTrigger id="specialty" className="h-11 w-full rounded-xl bg-background text-[15px]">
                  <SelectValue placeholder="Choose a specialty" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SPECIALTY_META).map(([key, meta]) => (
                    <SelectItem key={key} value={key} className="text-[15px]">
                      {meta.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2.5">
              <Label htmlFor="license" className="text-sm font-semibold text-muted-foreground">License or registration number</Label>
              <Input
                id="license"
                value={form.license}
                onChange={(e) => set("license", e.target.value)}
                placeholder="e.g. ASCP-MLT-000000"
                className="h-11 rounded-xl bg-background font-mono text-[15px]"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-semibold text-muted-foreground">Supporting document</span>
              {/* The file never leaves the browser; we only read its name. */}
              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.png,.jpg"
                className="hidden"
                onChange={(e) => set("fileName", e.target.files?.[0]?.name ?? "")}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-3 rounded-xl border border-dashed border-border-strong bg-background px-4 py-4 text-left transition-colors hover:border-primary/50"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-secondary">
                  {form.fileName ? <FileText className="size-4.5" aria-hidden /> : <Upload className="size-4.5" aria-hidden />}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-semibold">
                    {form.fileName ? <Mono>{form.fileName}</Mono> : "Choose a certificate or license scan"}
                  </span>
                  <span className="text-sm text-muted-foreground">PDF or image, up to 10 MB.</span>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-auto border-t border-border bg-background/60 p-4">
            <Button type="submit" className="h-12 w-full rounded-xl text-base font-semibold">
              Submit for verification
            </Button>
          </div>
        </form>

        <VerificationTimeline status={user?.credential_status} saved={saved} />
      </div>
    </PageContainer>
  );
}

function VerificationTimeline({ status, saved }) {
  // verified -> all three done; pending -> submitted done, review in progress.
  const current = status === "verified" ? 3 : status === "pending" ? 1 : 0;
  const dates = [formatDate(saved?.submitted_at), null, formatDate(saved?.reviewed_at)];

  return (
    <section className="h-fit rounded-2xl border border-border bg-card p-6 shadow-lift">
      <h2 className="text-lg font-bold tracking-tight">Verification status</h2>
      <ol className="mt-5 flex flex-col">
        {VERIFICATION_STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const last = i === VERIFICATION_STEPS.length - 1;
          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                    done && "border-success bg-success text-white",
                    active && "border-warning bg-card text-warning",
                    !done && !active && "border-border bg-background text-muted-foreground"
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} /> : <Mono>{i + 1}</Mono>}
                </span>
                {!last && <span className={cn("my-1 w-px flex-1", done ? "bg-success" : "bg-border")} />}
              </div>
              <div className={cn("flex flex-col gap-0.5", !last && "pb-6")}>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-[15px] font-semibold", !done && !active && "text-muted-foreground")}>{step.name}</span>
                  {done && dates[i] && <Mono className="text-xs text-muted-foreground">{dates[i]}</Mono>}
                  {active && <span className="text-xs font-semibold text-warning">In progress</span>}
                </div>
                <span className="text-sm text-muted-foreground">{step.description}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
