import Link from "next/link";

/** Wordmark + the broken-chain mark it's named for. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Unbound — home"
      className={`group inline-flex items-center gap-2.5 ${className}`}
    >
      <svg
        viewBox="0 0 44 20"
        className="h-4 w-[44px] text-fg"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        aria-hidden="true"
      >
        {/* left link, then the snapped halves, then the right link */}
        <ellipse cx="8" cy="10" rx="7" ry="5" />
        <path
          d="M20 5.5 A 5.5 4.5 0 0 0 20 14.5"
          strokeLinecap="round"
          className="origin-[20px_10px] transition-transform duration-500 group-hover:-translate-x-[3px] group-hover:-rotate-[18deg]"
        />
        <path
          d="M24 5.5 A 5.5 4.5 0 0 1 24 14.5"
          strokeLinecap="round"
          className="origin-[24px_10px] transition-transform duration-500 group-hover:translate-x-[3px] group-hover:rotate-[18deg]"
        />
        <ellipse cx="36" cy="10" rx="7" ry="5" />
      </svg>
      <span className="text-body-sm font-semibold uppercase tracking-[0.22em] text-fg">
        Unbound
      </span>
    </Link>
  );
}
