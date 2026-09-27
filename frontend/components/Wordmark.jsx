import { cn } from "@/lib/utils";

const SIZES = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-7xl sm:text-8xl md:text-9xl",
};

export default function Wordmark({ size = "sm", className }) {
  return (
    <span
      className={cn(
        "font-heading leading-none tracking-tight text-primary select-none",
        SIZES[size],
        className
      )}
    >
      BITGIG
    </span>
  );
}
