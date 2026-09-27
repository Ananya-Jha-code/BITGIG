import { cn } from "@/lib/utils";

const SIZES = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-6xl",
};

export default function Wordmark({ size = "sm", className }) {
  return (
    <span
      className={cn(
        "font-display leading-none tracking-tight text-primary select-none",
        SIZES[size],
        className
      )}
    >
      BITGIG
    </span>
  );
}
