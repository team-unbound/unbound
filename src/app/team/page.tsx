import type { Metadata } from "next";
import { CopyEmailButton } from "@/components/ui/copy-email-button";
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
            We run Unbound around our own studying and building, which is
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
              </article>
            </Reveal>
          ))}
        </div>

        {/* One inbox for all three of us, so one button under the row rather
            than the same address repeated on every card. */}
        <Reveal className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
          <CopyEmailButton
            email={siteConfig.contactEmail}
            className="rounded-full bg-fg px-7 py-3 text-body-sm font-medium text-canvas transition-opacity hover:opacity-85"
          >
            Email us
          </CopyEmailButton>
          <p className="text-body-sm text-fg-subtle">
            Copies{" "}
            <span className="font-mono text-fg-muted">
              {siteConfig.contactEmail}
            </span>{" "}
            to your clipboard.
          </p>
        </Reveal>
      </Section>

      <Section className="border-t border-line">
        <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-h2 font-medium text-balance">
              Want to help run this?
            </h2>
            <p className="mt-3 max-w-lg text-body-lg text-fg-muted text-pretty">
              We&rsquo;re always looking for people to host events, write, or
              build the product with us. Send us a note about what you&rsquo;d
              want to take on.
            </p>
          </div>
          <CopyEmailButton
            email={siteConfig.contactEmail}
            className="shrink-0 rounded-full border border-line-strong px-7 py-3 text-body-sm font-medium transition-colors hover:border-fg"
          >
            Copy our email
          </CopyEmailButton>
        </Reveal>
      </Section>
    </>
  );
}
