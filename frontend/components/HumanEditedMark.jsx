import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

// Counterpart to GeminiChip: an expert changed this Gemini segment.
export default function HumanEditedMark({ className, compact = false }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink font-semibold text-white",
        compact ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-[13px]",
        className
      )}
    >
      <PenLine className={compact ? "size-3" : "size-3.5"} aria-hidden />
      Expert-edited
    </span>
  );
}
