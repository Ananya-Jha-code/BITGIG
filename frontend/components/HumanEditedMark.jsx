import { PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

// Counterpart to GeminiChip: an expert changed this Gemini segment.
export default function HumanEditedMark({ className, compact = false }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-foreground/20 bg-foreground/5 font-medium text-foreground/80",
        compact ? "h-5 px-1.5 text-[11px]" : "h-6 px-2 text-xs",
        className
      )}
    >
      <PenLine className={compact ? "size-3" : "size-3.5"} aria-hidden />
      Human-edited
    </span>
  );
}
