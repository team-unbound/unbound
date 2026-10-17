"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WAITLIST_PATH } from "@/lib/waitlist";

const MESSAGE = "the unbound app is coming. get on the waitlist →";

/** Copies per half of the track; enough that one half outruns a wide screen. */
const REPEATS = 8;

/** Pages that already are the destination, or aren't for visitors. */
export function hidesWaitlistBar(pathname: string) {
  return (
    pathname === WAITLIST_PATH ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

/**
 * Sticky strip above the header, linking to the waitlist.
 *
 * Its presence sets --topbar-h (see globals.css), which the fixed header and
 * anything else measured from the top of the viewport offset by.
 *
 * The marquee is pure CSS: two identical halves, the track sliding by exactly
 * one half per loop, so the seam never shows. Reduced motion swaps it for a
 * still line in CSS too, which keeps server and client markup identical.
 */
export function WaitlistBar() {
  const pathname = usePathname();
  if (hidesWaitlistBar(pathname)) return null;

  const half = (
    <span className="flex shrink-0">
      {Array.from({ length: REPEATS }, (_, i) => (
        <span key={i} className="shrink-0 whitespace-nowrap px-6">
          {MESSAGE}
        </span>
      ))}
    </span>
  );

  return (
    <Link
      href={WAITLIST_PATH}
      data-waitlist-bar=""
      className="group sticky top-0 z-50 flex h-(--topbar-h) items-center overflow-hidden border-b border-line bg-surface text-body-sm text-fg-muted transition-colors hover:text-fg focus-visible:text-fg focus-visible:outline-offset-[-2px]"
    >
      <span className="sr-only">{MESSAGE}</span>

      <span
        aria-hidden="true"
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused] group-focus-visible:[animation-play-state:paused] motion-reduce:hidden"
      >
        {half}
        {half}
      </span>

      <span
        aria-hidden="true"
        className="shell hidden truncate text-center motion-reduce:block"
      >
        {MESSAGE}
      </span>
    </Link>
  );
}
