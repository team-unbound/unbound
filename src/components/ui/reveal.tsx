"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

/**
 * Fade-and-rise once, when the element first scrolls into view.
 *
 * Always renders the same `motion.div` — no manual `useReducedMotion()`
 * branch here. That branch used to early-return a plain `<div>` with no
 * style attribute when reduced motion was on, which differs structurally
 * from the styled `motion.div` the server always renders (SSR can't know
 * the client's OS preference), producing a hydration mismatch for anyone
 * with reduced motion enabled. Respecting the preference is handled once,
 * safely, by `<MotionConfig reducedMotion="user">` in the root layout,
 * which skips the actual interpolation without changing what gets rendered.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
