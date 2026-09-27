"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setRole } from "@/lib/role";

const ROLES = [
  {
    role: "company",
    icon: Building2,
    eyebrow: "For labs & life-science teams",
    title: "Post an annotation gig",
    points: ["Upload a lab video and your SOP", "Gemini pre-segments it in minutes", "Export an audited, agreed dataset"],
    cta: "Post a gig",
    href: "/company/gigs/new",
    primary: true,
  },
  {
    role: "expert",
    icon: Microscope,
    eyebrow: "For verified specialists",
    title: "Annotate as an expert",
    points: ["Tasks matched to your specialty", "Start from Gemini's draft, not a blank timeline", "Paid per completed task"],
    cta: "Find tasks",
    href: "/tasks",
    primary: false,
  },
];

export default function RoleSelect() {
  const router = useRouter();

  function choose(role, href) {
    setRole(role);
    router.push(href);
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 md:grid-cols-2">
      {ROLES.map(({ role, icon: Icon, eyebrow, title, points, cta, href, primary }) => (
        <div
          key={role}
          className="group flex flex-col gap-6 rounded-xl border border-border bg-card/80 p-6 backdrop-blur transition-colors duration-150 hover:border-foreground/15"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-elevated">
              <Icon className="size-5 text-foreground" aria-hidden />
            </div>
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <ul className="flex flex-col gap-2">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-foreground/50" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <Button
            variant={primary ? "default" : "outline"}
            size="lg"
            className="mt-auto h-10 w-full text-sm"
            onClick={() => choose(role, href)}
          >
            {cta}
            <ArrowRight data-icon="inline-end" className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
