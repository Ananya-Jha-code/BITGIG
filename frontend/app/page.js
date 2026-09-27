import BrandFooter from "@/components/landing/BrandFooter";
import Hero from "@/components/landing/Hero";
import ProtocolDemo from "@/components/landing/ProtocolDemo";
import RoleSplit from "@/components/landing/RoleSplit";
import SpecimenMarquee from "@/components/landing/SpecimenMarquee";
import Reveal from "@/components/Reveal";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <Hero />
      <SpecimenMarquee />

      <section className="mx-auto w-full max-w-360 px-6 py-32 lg:px-10">
        <Reveal className="mb-20">
          <h2 className="max-w-2xl font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-tight">
            Raw footage in. Trusted data out.
          </h2>
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
