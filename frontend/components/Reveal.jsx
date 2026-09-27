"use client";

import { motion } from "motion/react";

// Fades and lifts content in once it scrolls into view.
export default function Reveal({ children, delay = 0, y = 24, className, as = "div" }) {
  const Tag = motion[as];
  return (
    <Tag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </Tag>
  );
}
