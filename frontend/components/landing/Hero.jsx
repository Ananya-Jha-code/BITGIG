"use client";

import { Sparkles } from "lucide-react";
import BlurText from "@/components/reactbits/BlurText";
import ShinyText from "@/components/reactbits/ShinyText";

export default function Hero() {
  return (
    <section className="flex flex-col items-center gap-6 pt-16 text-center">
      <div className="inline-flex h-7 items-center gap-2 rounded-full border border-border bg-card/70 px-3 backdrop-blur">
        <Sparkles className="size-3.5 text-gemini" aria-hidden />
        <ShinyText
          text="Gemini-assisted · Expert-verified"
          color="#9a928a"
          shineColor="#f2ebdd"
          speed={3}
          delay={2}
          className="text-xs font-medium"
        />
      </div>

      <BlurText
        as="h1"
        text="Lab data, annotated by experts."
        animateBy="words"
        delay={70}
        stepDuration={0.45}
        animationFrom={{ filter: "blur(8px)", opacity: 0, y: -8 }}
        animationTo={[{ filter: "blur(0px)", opacity: 1, y: 0 }]}
        className="max-w-[820px] justify-center font-display text-5xl leading-[1.05] tracking-tight text-balance text-foreground md:text-7xl"
      />

      <p className="max-w-2xl text-lg leading-relaxed text-balance text-muted-foreground">
        Gemini drafts every segment of your lab video. Verified technicians correct it.
        Consensus catches what one reviewer would miss, and every change is on the record.
      </p>
    </section>
  );
}
