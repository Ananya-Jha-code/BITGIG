import { BadgeCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VerifiedBadge({ status = "verified", className }) {
  if (status !== "verified") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <Clock className="size-3.5" aria-hidden />
        Pending review
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-verified", className)}>
      <BadgeCheck className="size-3.5" aria-hidden />
      Verified
    </span>
  );
}
