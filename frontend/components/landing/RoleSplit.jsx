"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import DotGrid from "@/components/reactbits/DotGrid";
import { useChooseRole } from "@/lib/role";
import { cn } from "@/lib/utils";

const SIDES = [
  { role: "company", title: "I run a lab.", line: "Post a gig. Get expert-verified data back." },
  { role: "expert", title: "I'm a specialist.", line: "Review Gemini's drafts. Get paid per task." },
];

// Closing choice: two open typographic halves over an interactive dot field.
// Hovering one side brings it forward and quiets the other.
export default function RoleSplit() {
  const choose = useChooseRole();
  const [hovered, setHovered] = useState(null);

  return (
    <section className="relative overflow-hidden py-36">
      <div className="absolute inset-0" aria-hidden>
        <DotGrid dotSize={5} gap={22} baseColor="#dac8a3" activeColor="#d6247a" proximity={150} shockRadius={220} shockStrength={4} className="p-0" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_55%_at_50%_58%,var(--background)_50%,transparent_90%)]" aria-hidden />

      <div className="relative mx-auto flex max-w-360 flex-col gap-20 px-6 lg:px-10">
        <Reveal>
          <h2 className="max-w-3xl font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-tight">
            Which side of the bench are you on?
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-2" onMouseLeave={() => setHovered(null)}>
          {SIDES.map((side, i) => {
            const dimmed = hovered && hovered !== side.role;
            return (
              <Reveal key={side.role} delay={i * 0.12} className={cn(i === 1 && "md:border-l md:border-ink/15 md:pl-14", i === 0 && "md:pr-14")}>
                <button
                  type="button"
                  onClick={() => choose(side.role)}
                  onMouseEnter={() => setHovered(side.role)}
                  onFocus={() => setHovered(side.role)}
                  className={cn("group flex w-full flex-col items-start gap-5 py-6 text-left transition-opacity duration-300", dimmed && "opacity-30")}
                >
                  <span className="relative flex items-center gap-4">
                    <span className="font-display text-[clamp(2.5rem,4.6vw,4.25rem)] leading-none tracking-tight transition-colors duration-300 group-hover:text-primary">
                      {side.title}
                    </span>
                    <ArrowUpRight className="size-10 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary" strokeWidth={2.5} />
                    <motion.span
                      className="absolute -bottom-2 left-0 h-1 w-full origin-left rounded-full bg-primary"
                      initial={false}
                      animate={{ scaleX: hovered === side.role ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      aria-hidden
                    />
                  </span>
                  <span className="text-xl text-muted-foreground">{side.line}</span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
