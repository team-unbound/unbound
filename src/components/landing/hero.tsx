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
    // svh, not vh: on mobile browsers vh is the *large* viewport (address bar
    // hidden), so a 100vh pinned panel is taller than what you can actually see
    // whenever the bar is showing, and its bottom — the chain and the scroll cue
    // — sits below the fold until you scroll. svh is the address-bar-visible
    // height, so the panel fits in every state the browser can be in.
    // Both lengths share the unit on purpose: ChainScene's PIN_ENDS_AT is the
    // ratio between them, so they have to be measured the same way.
    <div ref={ref} className="relative h-[175svh]">
      {/* Copy and chain are one centred stack with a fixed gap, rather than the
          copy filling the space and the chain pinned beneath it — that left a
          large dead gap between them and pushed the chain onto the scroll cue. */}
      <section className="sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-6 overflow-hidden pb-10 pt-20 sm:gap-8 sm:pb-16">
        <div className="shell flex flex-col items-center text-center">
          <motion.div
            style={{ opacity: copyOpacity, y: copyY }}
            className="flex flex-col items-center"
          >
            <span className="eyebrow">For ambitious builders</span>

            <h1 className="mt-6 max-w-[16ch] text-display font-medium text-balance sm:mt-8">
              Your Vision.
              <br />
              <span className="text-fg-muted">Our Digital Reality.</span>
            </h1>

            <p className="mt-6 max-w-[52ch] text-body text-fg-muted text-pretty sm:mt-8 sm:text-body-lg">
              Unbound is where students, young founders, and creators find the
              people who take their ideas as seriously as they do.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
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

        {/* The chain sits directly below the copy and snaps as you scroll.
            Phones size the band off the viewport *width*: the camera fit is
            width-limited at these ratios, so the chain's drawn size already
            follows the canvas width and the height is only breathing room for
            the pieces to fall through. Tying it to vh instead made the band
            lurch every time the address bar moved, for no gain. (An
            aspect-ratio box can't do this job — the canvas defaults to 300px
            tall, which outvotes the ratio and then feeds back through the
            resize observer as the band's real height.) */}
        <div className="relative w-full shrink-0">
          <ChainScene
            progress={progress}
            animate={!reduceMotion}
            className="h-[16vw] w-full sm:h-[16vh] sm:[@media(min-height:840px)]:h-[20vh]"
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
