import GeminiChip from "@/components/GeminiChip";
import Mono from "@/components/Mono";
import SegmentTimeline, { TimelineLegend } from "@/components/SegmentTimeline";

// Static marketing preview of the product: Gemini's draft vs. an expert's correction.
const GEMINI = [
  { start: 1.2, end: 5.8, label: "aspirate", sop_step: 0, success: true, anomaly: null, source: "ai", edited: false },
  { start: 6.4, end: 11.0, label: "dispense", sop_step: 1, success: true, anomaly: null, source: "ai", edited: false },
  { start: 11.6, end: 17.3, label: "transfer", sop_step: 2, success: true, anomaly: null, source: "ai", edited: false },
  { start: 18.0, end: 23.5, label: "dispense", sop_step: 3, success: false, anomaly: "spill", source: "ai", edited: false },
];

const EXPERT = [
  GEMINI[0],
  { ...GEMINI[1], end: 12.4, edited: true },
  { ...GEMINI[2], start: 12.9, edited: true },
  GEMINI[3],
];

export default function WorkspacePreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Mono className="text-foreground">task_1</Mono>
          <span className="h-3 w-px bg-border" aria-hidden />
          <Mono>serial_dilution.mp4</Mono>
          <span className="h-3 w-px bg-border" aria-hidden />
          <Mono>00:25.00</Mono>
        </div>
        <GeminiChip glow>4 segments aligned to SOP</GeminiChip>
      </div>

      <div className="flex flex-col gap-5 px-5 pt-4 pb-5">
        <SegmentTimeline
          duration={25}
          currentTime={11.8}
          regions={[{ start: 11.0, end: 12.9 }]}
          lanes={[
            { id: "ai", title: "Gemini draft", subtitle: "gemini · 4 segments", segments: GEMINI },
            { id: "expert", title: "Dr. Maya Chen", subtitle: "lab technician", segments: EXPERT, selectedIndex: 1 },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <TimelineLegend />
          <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="size-2 rounded-sm border border-danger/60 bg-danger/20" aria-hidden />
            Boundary moved 1.4s, flagged for review
          </span>
        </div>
      </div>
    </div>
  );
}
