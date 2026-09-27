"use client";

import { ArrowUpRight } from "lucide-react";
import Mono from "@/components/Mono";
import Reveal from "@/components/Reveal";
import DotGrid from "@/components/reactbits/DotGrid";
import { useChooseRole } from "@/lib/role";
import { cn } from "@/lib/utils";

const PANELS = [
  {
    role: "company",
    kicker: "For labs",
    title: "Post a gig.",
    stats: [
      ["100%", "edits audit-logged"],
      ["2+", "experts per task"],
    ],
    className: "bg-ink text-white",
    kickerClass: "text-white/55",
    arrowClass: "bg-primary text-white",
  },
  {
    role: "expert",
    kicker: "For specialists",
    title: "Start annotating.",
    stats: [
      ["$12+", "per task"],
      ["0", "blank timelines"],
    ],
    className: "bg-beige text-ink",
    kickerClass: "text-ink/55",
    arrowClass: "bg-ink text-beige",
  },
];

// Closing call to action over an interactive dot field, like a microplate under a lens.
export default function RoleSplit() {
  const choose = useChooseRole();

  return (
    <section className="relative overflow-hidden py-28">
      <div className="absolute inset-0 opacity-90" aria-hidden>
        <DotGrid dotSize={5} gap={22} baseColor="#dac8a3" activeColor="#d6247a" proximity={140} shockRadius={220} shockStrength={4} className="p-0" />
      </div>

      <div className="relative mx-auto flex max-w-360 flex-col gap-12 px-6 lg:px-10">
        <Reveal>
          <h2 className="max-w-3xl font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-tight">
            Which side of the bench are you on?
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-2">
          {PANELS.map((p, i) => (
            <Reveal key={p.role} delay={i * 0.1}>
              <button
                type="button"
                onClick={() => choose(p.role)}
                className={cn(
                  "group flex min-h-80 w-full flex-col justify-between rounded-3xl p-8 text-left shadow-float transition-transform duration-300 ease-out hover:-translate-y-1.5 sm:p-10",
                  p.className
                )}
              >
                <div className="flex items-start justify-between">
                  <Mono className={cn("text-sm font-semibold tracking-wider uppercase", p.kickerClass)}>{p.kicker}</Mono>
                  <span
                    className={cn(
                      "flex size-14 items-center justify-center rounded-full transition-transform duration-300 ease-out group-hover:rotate-45",
                      p.arrowClass
                    )}
                  >
                    <ArrowUpRight className="size-6" />
                  </span>
                </div>
                <div className="flex flex-col gap-6">
                  <span className="font-display text-[clamp(2.5rem,4.5vw,4rem)] leading-none tracking-tight">{p.title}</span>
                  <div className="flex gap-10">
                    {p.stats.map(([value, label]) => (
                      <div key={label} className="flex flex-col">
                        <Mono className="text-2xl font-semibold">{value}</Mono>
                        <span className={cn("text-sm", p.kickerClass)}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
