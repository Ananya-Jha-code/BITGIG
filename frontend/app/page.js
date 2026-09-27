import BrandFooter from "@/components/landing/BrandFooter";
import Hero from "@/components/landing/Hero";
import ProtocolDemo from "@/components/landing/ProtocolDemo";
import RoleSplit from "@/components/landing/RoleSplit";
import SpecimenMarquee from "@/components/landing/SpecimenMarquee";
import Mono from "@/components/Mono";
import Reveal from "@/components/Reveal";

const READOUTS = [
  { value: "0.50", unit: "IoU", label: "overlap to match two raters" },
  { value: "2+", unit: "experts", label: "on every task" },
  { value: "100", unit: "%", label: "of edits audit-logged" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <SpecimenMarquee />

      <section className="mx-auto w-full max-w-360 px-6 py-28 lg:px-10">
        <Reveal className="mb-14 flex flex-wrap items-end justify-between gap-8">
          <h2 className="max-w-2xl font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-tight">
            Raw footage in. Trusted data out.
          </h2>
          <div className="flex gap-10">
            {READOUTS.map((r) => (
              <div key={r.label} className="flex flex-col gap-1">
                <span className="flex items-baseline gap-1">
                  <Mono className="text-3xl font-semibold">{r.value}</Mono>
                  <Mono className="text-sm text-muted-foreground">{r.unit}</Mono>
                </span>
                <span className="text-sm text-muted-foreground">{r.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <ProtocolDemo />
        </Reveal>
      </section>

      <RoleSplit />
      <BrandFooter />
    </div>
  );
}
