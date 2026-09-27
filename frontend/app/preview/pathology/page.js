// MOCK: pathology annotation preview. Synthetic SVG slide and sample regions (mocks/pathology.js); no patient data.
"use client";

import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import SyntheticSlide from "@/components/preview/SyntheticSlide";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PATHOLOGY_LABELS, pathologyRegions, pathologySlide } from "@/mocks/pathology";

export default function PathologyPreviewPage() {
  const [regions, setRegions] = useState(pathologyRegions);
  const [selectedId, setSelectedId] = useState(pathologyRegions[0].id);
  const [showOverlay, setShowOverlay] = useState(true);
  const selected = regions.find((r) => r.id === selectedId);

  // Relabeling is local state only; it marks the region as human-edited.
  function relabel(label) {
    setRegions((rs) => rs.map((r) => (r.id === selectedId ? { ...r, label, edited: r.label !== label || r.edited } : r)));
  }

  return (
    <PageContainer wide className="flex flex-col gap-6 py-8">
      <PageHeader
        eyebrow={<Mono>{pathologySlide.id}</Mono>}
        title="Pathology annotation"
        description="Gemini proposes tissue regions; a pathologist confirms or relabels each one."
        meta={<GeminiChip>Gemini pre-annotated</GeminiChip>}
        actions={
          <Button variant="outline" onClick={() => setShowOverlay((v) => !v)} className="rounded-xl bg-card">
            {showOverlay ? <EyeOff /> : <Eye />}
            {showOverlay ? "Hide regions" : "Show regions"}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          <div className="flex items-center justify-between border-b border-border px-5 py-3 text-sm text-muted-foreground">
            <span>{pathologySlide.stain}</span>
            <Mono>{pathologySlide.magnification}</Mono>
          </div>
          <SyntheticSlide
            seed={pathologySlide.seed}
            regions={regions}
            selectedId={selectedId}
            showOverlay={showOverlay}
            onSelect={setSelectedId}
          />
          <div className="flex flex-wrap items-center gap-4 border-t border-border px-5 py-3 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-6 border-t-2 border-dashed border-foreground/50" aria-hidden /> Gemini proposal
            </span>
            <span className="flex items-center gap-2">
              <span className="w-6 border-t-2 border-foreground/50" aria-hidden /> Drawn by expert
            </span>
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
            <div className="flex items-baseline justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-bold tracking-tight">Regions</h2>
              <Mono className="text-sm text-muted-foreground">{regions.length}</Mono>
            </div>
            <ul className="flex flex-col p-2">
              {regions.map((region, i) => {
                const meta = PATHOLOGY_LABELS[region.label];
                const active = region.id === selectedId;
                return (
                  <li key={region.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(region.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        active ? "bg-secondary" : "hover:bg-secondary/60"
                      )}
                    >
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: meta.color }} aria-hidden />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[15px] font-semibold">{meta.name}</span>
                        <span className="text-[13px] text-muted-foreground">
                          <Mono>R{String(i + 1).padStart(2, "0")}</Mono>
                          {region.confidence != null && (
                            <>
                              {" · "}
                              <Mono>{formatPercent(region.confidence, 0)}</Mono> confidence
                            </>
                          )}
                        </span>
                      </span>
                      {region.source === "ai" && !region.edited ? (
                        <GeminiChip size="xs">AI</GeminiChip>
                      ) : (
                        <span className="text-xs font-semibold text-muted-foreground">Expert</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {selected && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-lift">
              <span className="text-sm font-semibold text-muted-foreground">Label for selected region</span>
              <div className="mt-2.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Region label">
                {Object.entries(PATHOLOGY_LABELS).map(([key, meta]) => {
                  const active = selected.label === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => relabel(key)}
                      style={active ? { background: meta.color, borderColor: meta.color } : undefined}
                      className={cn(
                        "flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-all duration-150",
                        active ? "text-white shadow-sm" : "border-border bg-background text-foreground/80 hover:border-border-strong"
                      )}
                    >
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: active ? "#fff" : meta.color }} aria-hidden />
                      <span className="truncate">{meta.name}</span>
                      {active && <Check className="ml-auto size-4 shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </aside>
      </div>
    </PageContainer>
  );
}
