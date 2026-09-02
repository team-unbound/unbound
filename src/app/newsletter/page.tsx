import type { Metadata } from "next";
import { NewsletterForm } from "@/components/newsletter/newsletter-form";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Build notes, upcoming events and what the Unbound community is shipping — straight to your inbox.",
};

const promises = [
  "What members are building, in their own words",
  "Event invites before they go out anywhere else",
  "Short, useful build notes — never a wall of text",
];

export default function NewsletterPage() {
  return (
    <Section className="pt-40 lg:pt-48">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal>
          <span className="eyebrow">Newsletter</span>
          <h1 className="mt-8 text-h1 font-medium text-balance">
            The good parts, once a month.
          </h1>
          <p className="mt-6 max-w-md text-body-lg text-fg-muted text-pretty">
            No growth-hacking, no filler. Just what the community is making and
            where to find us next.
          </p>

          <ul className="mt-10 flex flex-col gap-3">
            {promises.map((promise) => (
              <li key={promise} className="flex items-start gap-3 text-body-sm text-fg-muted">
                <span aria-hidden="true" className="mt-2 h-px w-4 shrink-0 bg-line-strong" />
                {promise}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08}>
          <NewsletterForm />
        </Reveal>
      </div>
    </Section>
  );
}
