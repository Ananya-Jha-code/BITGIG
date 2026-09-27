import { BadgeCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VerifiedBadge({ status = "verified", className }) {
  if (status !== "verified") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-muted-foreground", className)}>
        <Clock className="size-3.5" aria-hidden />
        Pending review
      </span>
    );
  }
  return (
    <span className={cn("inline-flex h-5 items-center gap-1 rounded-full bg-beige px-1.5 text-[11px] font-semibold text-[#5a4410]", className)}>
      <BadgeCheck className="size-3.5 text-verified" aria-hidden />
      Verified
    </span>
  );
}
