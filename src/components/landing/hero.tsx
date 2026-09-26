import Link from "next/link";

/**
 * Opening statement: eyebrow, headline, subhead, two calls to action.
 *
 * Deliberately static — no canvas, no scroll-linked motion, nothing pinned, so
 * this renders on the server with no client bundle behind it.
 *
 * min-h rather than a fixed height: the section fills the first screen, but a
 * long headline on a short phone grows it instead of overflowing. svh is the
 * address-bar-visible viewport, so "the first screen" means the same thing
 * whether or not mobile browser chrome is showing.
 */
export function Hero() {
  return (
    <section className="flex min-h-[100svh] flex-col items-center justify-center pb-24 pt-32 sm:pb-32 sm:pt-36">
      <div className="shell flex flex-col items-center text-center">
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
      </div>
    </section>
  );
}
