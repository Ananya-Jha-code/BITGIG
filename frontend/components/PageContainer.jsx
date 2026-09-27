import { cn } from "@/lib/utils";

export default function PageContainer({ className, wide = false, ...props }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 py-10",
        wide ? "max-w-360" : "max-w-6xl",
        className
      )}
      {...props}
    />
  );
}
