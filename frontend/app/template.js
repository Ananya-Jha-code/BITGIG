"use client";

// Re-mounts on every navigation, so each screen fades in and the app reads as one flow.
import FadeContent from "@/components/reactbits/FadeContent";

export default function Template({ children }) {
  return (
    <FadeContent duration={200} ease="power1.out" className="flex flex-1 flex-col">
      {children}
    </FadeContent>
  );
}
