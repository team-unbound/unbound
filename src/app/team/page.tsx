import type { Metadata } from "next";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { team } from "@/lib/team";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team",
  description: "The people building Unbound.",
};

export default function TeamPage() {
  return (
    <>
      <Section className="pt-40 lg:pt-48">
        <Reveal>
          <span className="eyebrow">The team</span>
          <h1 className="mt-8 max-w-[18ch] text-h1 font-medium text-balance">
            Built by people doing the same thing you are.
          </h1>
          <p className="mt-6 max-w-xl text-body-lg text-fg-muted text-pretty">
            We run Unbound around our own studying and building — which is
            exactly why we know what it&rsquo;s missing.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, i) => (
            <Reveal key={member.name} delay={i * 0.08} className="bg-canvas">
              <article className="flex h-full flex-col items-start p-8 lg:p-10">
                <div
                  aria-hidden="true"
                  className="flex h-20 w-20 items-center justify-center rounded-full border border-line-strong bg-surface text-h3 font-medium text-fg-muted"
                >
                  {member.initials}
                </div>

                <h2 className="mt-6 text-h3 font-medium">{member.name}</h2>
                <p className="mt-1 text-body-sm text-fg-muted">{member.role}</p>

                <a
                  href={member.mailto}
                  className="mt-8 inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2 text-body-sm transition-colors hover:border-fg"
                >
                  Email us
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="border-t border-line">
        <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-h2 font-medium text-balance">
              Want to help run this?
            </h2>
            <p className="mt-3 max-w-lg text-body-lg text-fg-muted text-pretty">
              We&rsquo;re always looking for people to host events, write, or
              build the product with us.
            </p>
          </div>
          <a
            href={`mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent("I'd like to help run unbound.")}`}
            className="shrink-0 rounded-full bg-fg px-7 py-3 text-body-sm font-medium text-canvas transition-opacity hover:opacity-85"
          >
            Get in touch
          </a>
        </Reveal>
      </Section>
    </>
  );
}
