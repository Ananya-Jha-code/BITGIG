"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Check, FileText, Film, Loader2, Sparkles, Upload, X } from "lucide-react";
import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createGig, getCurrentUser } from "@/lib/api";
import { formatMoney, pad2 } from "@/lib/format";
import { SPECIALTY_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

const DEFAULT_SOP = `Aspirate 100 µL from stock tube A
Dispense into well B1 and mix 3x
Transfer 100 µL from B1 to B2
Dispense into B2 and mix 3x`;

// Shown while the gig is created, so the audience sees what Gemini is doing.
const PIPELINE_STEPS = ["Uploading video", "Gemini segments the video", "Aligning segments to SOP steps", "Creating expert tasks"];

export default function CreateGigPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Serial dilution pipetting QC");
  const [sopText, setSopText] = useState(DEFAULT_SOP);
  const [specialty, setSpecialty] = useState("lab_technician");
  const [pay, setPay] = useState("12");
  const [raters, setRaters] = useState("2");
  const [video, setVideo] = useState(null);
  const [sopFile, setSopFile] = useState(null);
  const [pipelineStep, setPipelineStep] = useState(null);

  const sopSteps = sopText.split("\n").map((s) => s.trim()).filter(Boolean);
  const canSubmit = title.trim() && sopSteps.length > 0 && video && pipelineStep == null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    const user = await getCurrentUser("company");
    const form = new FormData();
    form.set("company_id", user?.id ?? "");
    form.set("title", title.trim());
    form.set("sop_steps", JSON.stringify(sopSteps));
    form.set("required_specialty", specialty);
    form.set("pay_per_task", pay);
    form.set("raters_required", raters);
    form.set("video", video);
    if (sopFile) form.set("sop", sopFile);

    setPipelineStep(0);
    const ticker = setInterval(() => setPipelineStep((s) => Math.min(s + 1, PIPELINE_STEPS.length - 1)), 650);
    try {
      const [gig] = await Promise.all([createGig(form), new Promise((r) => setTimeout(r, PIPELINE_STEPS.length * 650))]);
      clearInterval(ticker);
      setPipelineStep(PIPELINE_STEPS.length);
      toast.success("Gig is live", { description: "Gemini pre-segmented the video. Experts can start now." });
      router.push(`/company/gigs/${gig.id}`);
    } catch (err) {
      clearInterval(ticker);
      setPipelineStep(null);
      toast.error("Couldn't create the gig", { description: err.message });
    }
  }

  return (
    <PageContainer className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Gigs / new"
        title="Create a gig"
        description="Upload a lab video and its SOP. Gemini pre-segments the video so experts correct instead of starting from scratch."
        meta={<GeminiChip>Auto pre-annotation</GeminiChip>}
      />

      <form onSubmit={handleSubmit} className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-7">
          <Section title="Gig details">
            <Field label="Title" htmlFor="title">
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 bg-elevated text-[15px]" />
            </Field>
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="Required specialty">
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger className="h-11 w-full bg-elevated text-[15px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SPECIALTY_META).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Pay per task (USD)" htmlFor="pay">
                <Input id="pay" type="number" min="1" step="0.5" value={pay} onChange={(e) => setPay(e.target.value)} className="h-11 bg-elevated font-mono text-[15px]" />
              </Field>
              <Field label="Experts per task">
                <Select value={raters} onValueChange={setRaters}>
                  <SelectTrigger className="h-11 w-full bg-elevated text-[15px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["2", "3"].map((n) => (
                      <SelectItem key={n} value={n}>
                        {n} experts
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          <Section title="Lab video">
            <FileDrop
              accept="video/*"
              icon={Film}
              file={video}
              onFile={setVideo}
              prompt="Drop a lab video or click to browse"
              hint="MP4 or MOV. Demo videos use cached Gemini results, so this is instant."
            />
          </Section>

          <Section
            title="SOP steps"
            aside={
              <Mono className="text-sm text-muted-foreground">
                {sopSteps.length} {sopSteps.length === 1 ? "step" : "steps"}
              </Mono>
            }
          >
            <p className="-mt-1 text-sm text-muted-foreground">One step per line. Gemini aligns every segment to one of these steps.</p>
            <Textarea
              value={sopText}
              onChange={(e) => setSopText(e.target.value)}
              rows={6}
              className="bg-elevated font-mono text-sm leading-relaxed"
              aria-label="SOP steps, one per line"
            />
            <FileDrop accept=".txt,.pdf,.md" icon={FileText} file={sopFile} onFile={setSopFile} prompt="Attach the SOP document (optional)" compact />
          </Section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24">
          <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-lift">
            <span className="text-lg font-bold">Summary</span>
            <ol className="flex flex-col gap-2">
              {sopSteps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <Mono className="text-muted-foreground">{pad2(i + 1)}</Mono>
                  <span className="line-clamp-2">{step}</span>
                </li>
              ))}
            </ol>
            <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
              <dt className="text-muted-foreground">Experts per task</dt>
              <dd className="text-right font-mono font-semibold">{raters}</dd>
              <dt className="text-muted-foreground">Pay per task</dt>
              <dd className="text-right font-mono font-semibold">{formatMoney(Number(pay) || 0)}</dd>
              <dt className="text-muted-foreground">Cost per video</dt>
              <dd className="text-right font-mono font-semibold">{formatMoney((Number(pay) || 0) * Number(raters))}</dd>
            </dl>
            <Button type="submit" size="lg" disabled={!canSubmit} className="h-12 rounded-full text-[15px]">
              <Sparkles data-icon="inline-start" />
              Post gig and pre-annotate
            </Button>
            {!video && <p className="-mt-2 text-center text-[13px] text-muted-foreground">Add a video to continue.</p>}
          </section>

          <AnimatePresence>{pipelineStep != null && <PipelineProgress step={pipelineStep} />}</AnimatePresence>
        </aside>
      </form>
    </PageContainer>
  );
}

function Section({ title, aside, children }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-lift">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{title}</span>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, children }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </Label>
      {children}
    </div>
  );
}

function FileDrop({ accept, icon: Icon, file, onFile, prompt, hint, compact = false }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFile(dropped);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-elevated px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-success/12 text-success">
          <Check className="size-4" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{file.name}</span>
          <Mono className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</Mono>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={() => onFile(null)} aria-label={`Remove ${file.name}`}>
          <X />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong text-center transition-colors duration-150 hover:border-primary/50 hover:bg-primary-soft/30",
        compact ? "flex-row py-4" : "py-10",
        dragging && "border-primary bg-primary-soft/40"
      )}
    >
      <span className={cn("flex items-center justify-center rounded-full bg-secondary", compact ? "size-8" : "size-11")}>
        {compact ? <Upload className="size-4" aria-hidden /> : <Icon className="size-5" aria-hidden />}
      </span>
      <span className={cn("font-semibold", compact ? "text-sm" : "text-base")}>{prompt}</span>
      {hint && <span className="max-w-sm text-sm text-muted-foreground">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onFile(picked);
          e.target.value = "";
        }}
      />
    </button>
  );
}

function PipelineProgress({ step }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="gemini-glow flex flex-col gap-4 rounded-2xl border border-primary/25 bg-card p-6 shadow-lift"
      aria-live="polite"
    >
      <GeminiChip glow>Gemini at work</GeminiChip>
      <ol className="flex flex-col gap-3">
        {PIPELINE_STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
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
    </motion.section>
  );
}
