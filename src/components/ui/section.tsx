import type { ReactNode } from "react";

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-section lg:py-section-lg ${className}`}>
      <div className="shell">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-6 text-h2 font-medium text-balance">{title}</h2>
      {intro ? (
        <p className="mt-5 text-body-lg text-fg-muted text-pretty">{intro}</p>
      ) : null}
    </div>
  );
}
