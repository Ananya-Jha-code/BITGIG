"use client";

import Threads from "@/components/reactbits/Threads";

// Oscilloscope-like magenta traces at low opacity, faded out at the edges.
export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[880px] overflow-hidden" aria-hidden>
      <div className="absolute inset-0 opacity-45 mask-[radial-gradient(ellipse_60%_40%_at_50%_50%,black_20%,transparent_75%)]">
        <Threads color={[0.84, 0.14, 0.48]} amplitude={0.7} distance={0.15} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-background" />
    </div>
  );
}
