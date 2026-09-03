"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { ChainScene } from "./chain-scene";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.35,
    restDelta: 0.0005,
  });

  // With reduced motion the chain stays whole and nothing is scroll-driven.
  const still = useMotionValue(0);
  const progress = reduceMotion ? still : smooth;

  const copyOpacity = useTransform(progress, [0, 0.45], [1, 0]);
  const copyY = useTransform(progress, [0, 0.45], [0, -60]);
  const cueOpacity = useTransform(progress, [0, 0.15], [1, 0]);

  return (
    // The tall wrapper is the scroll runway; the inner panel pins while the chain breaks.
    <div ref={ref} className="relative h-[175vh]">
      {/* Copy and chain are one centred stack with a fixed gap, rather than the
          copy filling the space and the chain pinned beneath it — that left a
          large dead gap between them and pushed the chain onto the scroll cue. */}
      <section className="sticky top-0 flex h-screen flex-col items-center justify-center gap-8 overflow-hidden pb-16 pt-20">
        <div className="shell flex flex-col items-center text-center">
          <motion.div
            style={{ opacity: copyOpacity, y: copyY }}
            className="flex flex-col items-center"
          >
            <span className="eyebrow">For ambitious builders</span>

            <h1 className="mt-8 max-w-[16ch] text-display font-medium text-balance">
              Your Vision.
              <br />
              <span className="text-fg-muted">Our Digital Reality.</span>
            </h1>

            <p className="mt-8 max-w-[52ch] text-body-lg text-fg-muted text-pretty">
              Unbound is where students, young founders, and creators find the
              people who take their ideas as seriously as they do.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/community"
                className="rounded-full bg-fg px-7 py-3 text-body-sm font-medium text-canvas transition-opacity hover:opacity-85"
              >
                Join the community
              </Link>
              <Link
                href="/about"
                className="rounded-full border border-line-strong px-7 py-3 text-body-sm font-medium text-fg transition-colors hover:border-fg"
              >
                Our story
              </Link>
            </div>
          </motion.div>
        </div>

        {/* The chain sits directly below the copy and snaps as you scroll. */}
        <div className="relative w-full shrink-0">
          <ChainScene
            progress={progress}
            animate={!reduceMotion}
            className="mx-auto h-[13vh] w-full max-w-4xl sm:h-[16vh] sm:[@media(min-height:840px)]:h-[20vh]"
          />
        </div>

        <motion.div
          style={{ opacity: cueOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
        >
          <span className="text-label uppercase tracking-[0.18em] text-fg-subtle">
            Scroll to break free
          </span>
        </motion.div>
      </section>
    </div>
  );
}
