import type { ReactNode } from "react";
import { Section } from "./section";

/**
 * Shared chrome for /privacy and /terms. These are long-form documents rather
 * than marketing pages, so they get a single narrow measure and a heavier
 * heading rhythm than the rest of the site.
 */
export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  /** ISO date, rendered and used as the <time> value. */
  updated: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <Section className="pt-40 lg:pt-48">
      {/* The shell is 76rem; a legal document wants a ~42rem measure, so the
          column is centred in it rather than left against the gutter. */}
      <div className="mx-auto max-w-2xl">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-8 text-h1 font-medium text-balance">{title}</h1>
        <p className="mt-6 text-body-lg text-fg-muted text-pretty">{intro}</p>
        <p className="mt-6 text-body-sm text-fg-subtle">
          Last updated{" "}
          <time dateTime={updated}>
            {new Date(`${updated}T00:00:00Z`).toLocaleDateString("en-CA", {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
          </time>
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-2xl">{children}</div>
    </Section>
  );
}

export function Clause({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line py-10 first:border-t-0 first:pt-0">
      <h2 className="text-h3 font-medium">{heading}</h2>
      <div className="mt-4 flex flex-col gap-4 text-body text-fg-muted text-pretty [&_a]:text-fg [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-fg">
        {children}
      </div>
    </section>
  );
}

export function ClauseList({ children }: { children: ReactNode }) {
  return (
    <ul className="flex flex-col gap-2.5 border-l border-line-strong pl-5">
      {children}
    </ul>
  );
}
