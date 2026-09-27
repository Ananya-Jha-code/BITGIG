import { cn } from "@/lib/utils";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex size-11 items-center justify-center rounded-full bg-secondary">
          <Icon className="size-5 text-foreground/70" aria-hidden />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold">{title}</p>
        {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
