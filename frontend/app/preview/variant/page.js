// MOCK: variant classification preview. All variants in mocks/variants.js are synthetic.
"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ACMG_CLASSES, CRITERIA_META, variants } from "@/mocks/variants";

const CLASS_BY_KEY = Object.fromEntries(ACMG_CLASSES.map((c) => [c.key, c]));

function formatFreq(f) {
  if (f === 0) return "0";
  return f < 0.001 ? f.toExponential(1) : f.toFixed(4);
}

export default function VariantPreviewPage() {
  const [selectedId, setSelectedId] = useState(variants[0].id);
  const [calls, setCalls] = useState({});
  const selected = variants.find((v) => v.id === selectedId);

  return (
    <PageContainer wide className="flex flex-col gap-6 py-8">
      <PageHeader
        eyebrow={<Mono>batch_VC-0192</Mono>}
        title="Variant classification"
        description="A geneticist assigns an ACMG-style class to each variant, starting from Gemini's suggestion."
        meta={<GeminiChip>Gemini suggested</GeminiChip>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="h-fit overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          <div className="flex items-baseline justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-bold tracking-tight">Variants</h2>
            <span className="text-sm text-muted-foreground">
              <Mono>{Object.keys(calls).length}</Mono> / <Mono>{variants.length}</Mono> classified
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Gene</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Zygosity</TableHead>
                <TableHead className="text-right">Pop. freq</TableHead>
                <TableHead className="text-right">In silico</TableHead>
                <TableHead className="pr-6">Class</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => {
                const call = calls[v.id] && CLASS_BY_KEY[calls[v.id]];
                return (
                  <TableRow
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    data-state={v.id === selectedId ? "selected" : undefined}
                    className="cursor-pointer"
                  >
                    <TableCell className="pl-6 font-semibold italic">{v.gene}</TableCell>
                    <TableCell>
                      <Mono>{v.hgvs}</Mono>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{v.zygosity}</TableCell>
                    <TableCell className="text-right">
                      <Mono>{formatFreq(v.pop_freq)}</Mono>
                    </TableCell>
                    <TableCell className="text-right">
                      <Mono>{v.in_silico == null ? "—" : v.in_silico.toFixed(2)}</Mono>
                    </TableCell>
                    <TableCell className="pr-6">
                      {call ? (
                        <span className={cn("inline-flex h-6 items-center rounded-full border px-2 font-mono text-xs font-semibold", call.tone)}>
                          {call.short}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unclassified</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>

        {selected && (
          <VariantDetail
            variant={selected}
            call={calls[selected.id]}
            onCall={(key) => setCalls((c) => ({ ...c, [selected.id]: key }))}
          />
        )}
      </div>
    </PageContainer>
  );
}

function VariantDetail({ variant, call, onCall }) {
  const suggestion = CLASS_BY_KEY[variant.gemini.class];

  return (
    <section className="h-fit overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
      <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
        <span className="text-lg font-bold italic">{variant.gene}</span>
        <Mono className="text-sm text-muted-foreground">{variant.hgvs}</Mono>
      </div>

      <div className="flex flex-col gap-6 p-5">
        <div className="rounded-xl border border-primary/25 bg-primary-soft/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <GeminiChip size="xs">Gemini suggestion</GeminiChip>
            <span className="text-sm font-semibold">{suggestion.name}</span>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-foreground/85">{variant.gemini.rationale}</p>
          {call !== suggestion.key && (
            <Button size="sm" variant="outline" onClick={() => onCall(suggestion.key)} className="mt-3 rounded-lg bg-card">
              Accept suggestion
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-semibold text-muted-foreground">Evidence criteria</span>
          <ul className="flex flex-col gap-2">
            {variant.criteria.map((code) => {
              const meta = CRITERIA_META[code];
              const pathogenic = meta?.strength === "pathogenic";
              return (
                <li key={code} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={cn(
                      "inline-flex h-6 w-12 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold",
                      pathogenic ? "border-danger/30 bg-danger/10 text-danger" : "border-success/30 bg-success/10 text-success"
                    )}
                  >
                    {code}
                  </span>
                  <span className="text-foreground/80">{meta?.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-semibold text-muted-foreground">Your classification</span>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="ACMG class">
            {ACMG_CLASSES.map((c) => {
              const active = call === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onCall(c.key)}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-xl border px-3.5 text-[15px] font-semibold transition-all duration-150",
                    active ? c.tone + " shadow-sm" : "border-border bg-background text-foreground/80 hover:border-border-strong hover:text-foreground"
                  )}
                >
                  <Mono className="w-8 text-left text-xs opacity-70">{c.short}</Mono>
                  {c.name}
                  {c.key === suggestion.key && !active && <span className="ml-auto text-xs font-medium text-gemini">Gemini</span>}
                  {active && <Check className="ml-auto size-4" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
