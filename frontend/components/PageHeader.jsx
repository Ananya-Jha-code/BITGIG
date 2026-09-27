import { cn } from "@/lib/utils";

// eyebrow: small mono context line (IDs, breadcrumb). actions: the screen's one primary action.
export default function PageHeader({ eyebrow, title, description, meta, actions, className }) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow && <div className="font-mono text-[13px] text-muted-foreground">{eyebrow}</div>}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {meta}
        </div>
        {description && <p className="max-w-2xl text-base text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
