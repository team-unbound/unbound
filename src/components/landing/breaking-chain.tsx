"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

/**
 * Scroll-linked chain that snaps apart as the hero scrolls away.
 *
 * All motion is driven by MotionValues bound straight to `transform` / `opacity`,
 * so scrolling never re-renders React — only the compositor works.
 */

const LINK_COUNT = 17;
const MID = Math.floor(LINK_COUNT / 2); // the weak link that snaps
const SPACING = 34;
const HALF_SPAN = ((LINK_COUNT - 1) * SPACING) / 2;

/** Wide oval link geometry. */
const RX = 26;
const RY = 14;

type Progress = MotionValue<number>;

function ChainLink({ index, progress }: { index: number; progress: Progress }) {
  const offset = (index - MID) * SPACING;
  const side = index < MID ? -1 : 1;
  // 0 at the break, 1 at the outermost link — the far ends travel furthest.
  const dist = Math.abs(index - MID) / MID;
  const upright = index % 2 === 1;

  // Ends whip outward; links near the break barely move.
  const x = useTransform(progress, [0.12, 1], [0, side * (60 + dist * 420)]);
  const y = useTransform(
    progress,
    [0.12, 1],
    [0, (index % 2 === 0 ? -1 : 1) * dist * 90],
  );
  const rotate = useTransform(
    progress,
    [0.12, 1],
    [0, side * (18 + dist * 120)],
  );
  const opacity = useTransform(progress, [0.55, 0.95], [1, 0.08 + (1 - dist) * 0.2]);

  return (
    <motion.g style={{ x, y, rotate, opacity }}>
      <ellipse
        cx={offset}
        cy={0}
        rx={upright ? RY - 2 : RX}
        ry={upright ? RX - 2 : RY}
        fill="none"
        stroke="currentColor"
        strokeWidth={upright ? 5 : 6}
        vectorEffect="non-scaling-stroke"
      />
    </motion.g>
  );
}

/** One half of the centre link, hinged open before the chain flies apart. */
function BrokenHalf({ side, progress }: { side: -1 | 1; progress: Progress }) {
  // Sweep flag picks the left or right arc of the same oval.
  const sweep = side === 1 ? 1 : 0;
  const d = `M 0,${-RY} A ${RX},${RY} 0 0 ${sweep} 0,${RY}`;

  const x = useTransform(progress, [0, 0.35, 1], [0, side * 26, side * 150]);
  const y = useTransform(progress, [0, 0.35, 1], [0, side * -8, side * -46]);
  const rotate = useTransform(progress, [0, 0.35, 1], [0, side * 42, side * 165]);
  const opacity = useTransform(progress, [0.3, 0.75], [1, 0]);

  return (
    <motion.path
      d={d}
      style={{ x, y, rotate, opacity }}
      fill="none"
      stroke="currentColor"
      strokeWidth={6}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function BreakingChain({ progress }: { progress: Progress }) {
  const reduceMotion = useReducedMotion();

  const links = [];
  for (let i = 0; i < LINK_COUNT; i++) {
    if (i === MID) continue;
    links.push(<ChainLink key={i} index={i} progress={progress} />);
  }

  return (
    <svg
      viewBox={`${-HALF_SPAN - 130} -120 ${(HALF_SPAN + 130) * 2} 240`}
      className="w-full text-fg"
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      {links}
      {!reduceMotion && (
        <>
          <BrokenHalf side={-1} progress={progress} />
          <BrokenHalf side={1} progress={progress} />
        </>
      )}
      {reduceMotion && (
        <ellipse
          cx={0}
          cy={0}
          rx={RX}
          ry={RY}
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
        />
      )}
    </svg>
  );
}

/** Wraps the chain with its own scroll tracker, for standalone use. */
export function ScrollLinkedChain() {
  const ref = useRef<HTMLDivElement>(null);
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

  return (
    <div ref={ref}>
      <BreakingChain progress={smooth} />
    </div>
  );
}
