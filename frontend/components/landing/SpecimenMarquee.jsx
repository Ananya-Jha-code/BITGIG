"use client";

import ScrollVelocity from "@/components/reactbits/ScrollVelocity";

// Brand band: magenta Archivo Black on beige, speeding up with scroll.
export default function SpecimenMarquee() {
  return (
    <section className="relative overflow-hidden border-y border-beige-deep bg-beige py-8 text-primary" aria-label="Specialties">
      <ScrollVelocity
        texts={[
          "Pipetting ✦ Serial dilution ✦ PCR setup ✦ Cell culture ✦ ",
          "Pathology ✦ Radiology ✦ Variant calling ✦ Genomics ✦ ",
        ]}
        velocity={40}
        numCopies={4}
        className="px-2 font-display text-[clamp(3rem,7vw,6.5rem)] leading-[1.05] tracking-tight [&:nth-child(n)]:select-none"
        parallaxClassName="py-1"
      />
    </section>
  );
}
