import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { CardGrid } from "@/components/ui/card-grid";
import { Reveal } from "@/components/ui/reveal";
import { Section, SectionHeading } from "@/components/ui/section";

const pillars = [
  {
    index: "01",
    title: "A community that ships",
    body: "Profiles from students, founders and creators — what they're building, what they're good at, and what they need help with.",
    href: "/community",
    cta: "Browse the community",
  },
  {
    index: "02",
    title: "Pair up for anything",
    body: "Send a pairing request with a real reason. If they accept, you both get each other's email. If they don't, nothing is shared.",
    href: "/community",
    cta: "Find a partner",
  },
  {
    index: "03",
    title: "Events worth showing up to",
    body: "Workshops, build nights and demo sessions — small enough that you actually meet everyone in the room.",
    href: "/events",
    cta: "See what's coming",
  },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <Section>
        <Reveal>
          <SectionHeading
            eyebrow="Why Unbound"
            title="Ambition is common. The people who match it aren't."
            intro="Most builders stall because they're doing it alone. Unbound exists to fix the part no tutorial covers — finding the right people, at the right moment, to build the thing with you."
          />
        </Reveal>

        <CardGrid count={pillars.length} className="mt-16">
          {pillars.map((pillar, i) => (
            <Reveal key={pillar.index} delay={i * 0.08} className="bg-canvas">
              <article className="flex h-full flex-col p-8 lg:p-10">
                <span className="font-mono text-body-sm text-fg-subtle">
                  {pillar.index}
                </span>
                <h3 className="mt-6 text-h3 font-medium text-balance">
                  {pillar.title}
                </h3>
                <p className="mt-3 flex-1 text-body-sm text-fg-muted text-pretty">
                  {pillar.body}
                </p>
                <Link
                  href={pillar.href}
                  className="mt-6 inline-flex items-center gap-2 py-2 text-body-sm text-fg underline-offset-4 hover:underline"
                >
                  {pillar.cta}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </article>
            </Reveal>
          ))}
        </CardGrid>
      </Section>

      <Section className="border-t border-line">
        <Reveal>
          <blockquote className="mx-auto max-w-4xl text-center">
            <p className="text-h1 font-medium text-balance">
              &ldquo;Unbound&rdquo; is not a mood.{" "}
              <span className="text-fg-muted">
                It&rsquo;s what happens when the thing holding you back finally
                gives.
              </span>
            </p>
          </blockquote>
        </Reveal>
      </Section>

      <Section className="border-t border-line">
        <Reveal className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="eyebrow">Get started</span>
            <h2 className="mt-6 text-h2 font-medium text-balance">
              Come build with people who get it.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/community"
              className="rounded-full bg-fg px-7 py-3 text-body-sm font-medium text-canvas transition-opacity hover:opacity-85"
            >
              Join Unbound
            </Link>
            <Link
              href="/newsletter"
              className="rounded-full border border-line-strong px-7 py-3 text-body-sm font-medium transition-colors hover:border-fg"
            >
              Get the newsletter
            </Link>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
