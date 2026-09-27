import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

// Shown on mocked screens so nobody mistakes sample data for the live flow.
export default function MockBanner({ children = "Preview with sample data. Not part of the live flow yet.", className }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground",
        className
      )}
    >
      <FlaskConical className="size-3.5 text-verified" aria-hidden />
      <span className="font-mono uppercase tracking-wider text-verified">Preview</span>
      <span>{children}</span>
    </div>
  );
}
