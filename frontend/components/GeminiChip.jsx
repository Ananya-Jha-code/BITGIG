import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Marks anything Gemini produced, so it's always clear where AI is doing the work.
export default function GeminiChip({ children = "Gemini", glow = false, size = "sm", className }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-primary-soft font-semibold text-gemini",
        size === "xs" ? "h-6 px-2 text-xs" : "h-7 px-2.5 text-[13px]",
        glow && "gemini-glow",
        className
      )}
    >
      <Sparkles className={size === "xs" ? "size-3" : "size-3.5"} aria-hidden />
      {children}
    </span>
  );
}
