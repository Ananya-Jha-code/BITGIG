import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

// Shown on mocked screens so nobody mistakes sample data for the live flow.
export default function MockBanner({ children = "Sample data. Not part of the live flow yet.", className }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-lg bg-beige px-3 py-2 text-sm text-[#5a4410]", className)}>
      <FlaskConical className="size-4" aria-hidden />
      <span className="font-mono text-xs font-semibold uppercase tracking-wider">Preview</span>
      <span>{children}</span>
    </div>
  );
}
