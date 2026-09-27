import Hero from "@/components/landing/Hero";
import HeroBackground from "@/components/landing/HeroBackground";
import WorkspacePreview from "@/components/landing/WorkspacePreview";
import PageContainer from "@/components/PageContainer";
import RoleSelect from "@/components/RoleSelect";
import Wordmark from "@/components/Wordmark";

const FACTS = [
  { value: "IoU ≥ 0.50", label: "Temporal overlap required before two raters' segments count as a match" },
  { value: "2+ experts", label: "Independent, credential-verified reviewers on every task" },
  { value: "100%", label: "Of edits written to an append-only audit log" },
];

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col">
      <HeroBackground />

      <PageContainer className="relative flex flex-col gap-24 pb-16">
        <div className="flex flex-col gap-12">
          <Hero />
          <RoleSelect />
        </div>

        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">The workspace</span>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance">
              Experts correct the AI. They don&apos;t start from zero.
            </h2>
            <p className="max-w-2xl text-balance text-muted-foreground">
              Every segment Gemini proposes is aligned to a step in your SOP. Experts adjust boundaries,
              labels and anomalies, and every correction is tracked against the original draft.
            </p>
          </div>
          <WorkspacePreview />
        </section>

        <section className="grid gap-8 border-t border-border pt-10 sm:grid-cols-3">
          {FACTS.map((fact) => (
            <div key={fact.value} className="flex flex-col gap-2">
              <span className="font-mono text-2xl font-medium tracking-tight tabular-nums">{fact.value}</span>
              <span className="text-sm text-muted-foreground">{fact.label}</span>
            </div>
          ))}
        </section>
      </PageContainer>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Wordmark size="sm" className="text-base text-foreground/80" />
          <span className="font-mono text-[11px] text-muted-foreground">Built with Gemini on Google Cloud</span>
        </div>
      </footer>
    </div>
  );
}
