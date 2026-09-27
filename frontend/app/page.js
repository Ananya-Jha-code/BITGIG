import { Sparkles } from "lucide-react";
import Wordmark from "@/components/Wordmark";
import RoleSelect from "@/components/RoleSelect";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    title: "Gemini drafts",
    body: "Every video is pre-segmented and aligned to your SOP before an expert sees it.",
  },
  {
    title: "Experts correct",
    body: "Verified lab technicians fix boundaries, labels and anomalies instead of starting from zero.",
  },
  {
    title: "Consensus checks",
    body: "Multiple raters per task. Disagreements are flagged, explained and adjudicated, with a full audit log.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-center gap-6 pt-6 text-center">
        <Badge className="h-7 gap-1.5 px-3 text-sm">
          <Sparkles />
          Pre-annotated by Gemini
        </Badge>
        <Wordmark size="lg" />
        <p className="max-w-2xl text-lg text-foreground/80 sm:text-xl">
          Expert annotation for lab and medical data. Verified specialists
          correct AI drafts, so you get training data you can trust.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex flex-col gap-2">
            <span className="font-heading text-3xl text-primary">
              0{i + 1}
            </span>
            <h3 className="text-lg">{step.title}</h3>
            <p className="text-sm text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center text-3xl">Choose your role</h2>
        <RoleSelect />
      </section>
    </div>
  );
}
