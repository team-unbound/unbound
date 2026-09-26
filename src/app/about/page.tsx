import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { Section, SectionHeading } from "@/components/ui/section";
import { siteConfig } from "@/lib/site";
import { CopyEmailButton } from "@/components/ui/copy-email-button";
import {
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  YouTubeIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Unbound exists, who it's for, and what we're building for ambitious students, founders and creators.",
};

const principles = [
  {
    index: "01",
    title: "Show the work",
    body: "Half-finished counts. The people worth meeting are the ones already building something, not the ones waiting until it's presentable.",
  },
  {
    index: "02",
    title: "Small rooms, real people",
    body: "We'd rather run an event where thirty people actually talk than a hall where three hundred watch a slide deck.",
  },
  {
    index: "03",
    title: "Ask directly",
    body: "Pairing requests need a reason. No cold spam, no networking theatre — just tell someone why you want to build with them.",
  },
  {
    index: "04",
    title: "Your details are yours",
    body: "Nothing on your profile is public by default beyond what you write. Contact details are shared only when you accept a request.",
  },
];

const socials = [
  {
    href: siteConfig.socials.instagram,
    label: "Instagram",
    handle: "@Unbound.x",
    Icon: InstagramIcon,
  },
  {
    href: siteConfig.socials.linkedin,
    label: "LinkedIn",
    handle: "become-unbound",
    Icon: LinkedInIcon,
  },
  {
    href: siteConfig.socials.youtube,
    label: "YouTube",
    handle: "@unbounding_",
    Icon: YouTubeIcon,
  },
];

export default function AboutPage() {
  return (
    <>
      <Section className="pt-40 lg:pt-48">
        <Reveal>
          <span className="eyebrow">About Unbound</span>
          <h1 className="mt-8 max-w-[20ch] text-h1 font-medium text-balance">
            The chain was never the point.{" "}
            <span className="text-fg-muted">Breaking it was.</span>
          </h1>
        </Reveal>
      </Section>

      <Section className="border-t border-line">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <Reveal>
            <SectionHeading eyebrow="Our story" title="Where this came from" />
          </Reveal>

          <Reveal
            delay={0.08}
            className="flex flex-col gap-6 text-body-lg text-fg-muted text-pretty"
          >
            <p>
              Unbound started with a frustration a lot of us recognise. You have
              the idea, the late nights and more ambition than your timetable
              knows what to do with — and absolutely no one around you building
              at the same intensity.
            </p>
            <p>
              So you do it alone. You lose momentum somewhere between the third
              rewrite and the semester ending, and the thing quietly stops
              existing. Not because it was a bad idea. Because building alone is
              a hard way to build anything.
            </p>
            <p>
              We started Unbound to be the room we were looking for: students,
              young founders and creators who are actually shipping, close
              enough to each other to help. A place where you can find the
              designer for your app, the co-founder for your idea, or just
              someone who understands why you&rsquo;re still awake.
            </p>
            <p className="text-fg">
              The logo is a chain breaking. That&rsquo;s the whole thesis —
              whatever&rsquo;s been holding your work back, this is where it
              gives.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section className="border-t border-line">
        <Reveal>
          <SectionHeading
            eyebrow="How we operate"
            title="Four things we hold to"
          />
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
          {principles.map((principle, i) => (
            <Reveal
              key={principle.index}
              delay={i * 0.06}
              className="bg-canvas"
            >
              <article className="flex h-full flex-col p-8 lg:p-10">
                <span className="font-mono text-body-sm text-fg-subtle">
                  {principle.index}
                </span>
                <h3 className="mt-6 text-h3 font-medium text-balance">
                  {principle.title}
                </h3>
                <p className="mt-3 text-body-sm text-fg-muted text-pretty">
                  {principle.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section className="border-t border-line">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <Reveal>
            <SectionHeading
              eyebrow="Find us"
              title="Come say hello"
              intro="We answer everything. Pitch us an event, ask about joining, or just tell us what you're building."
            />
          </Reveal>

          <Reveal delay={0.08}>
            <ul className="divide-y divide-line border-y border-line">
              {socials.map(({ href, label, handle, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-center gap-5 py-5 transition-opacity hover:opacity-80"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-fg-muted transition-colors group-hover:text-fg" />
                    <span className="text-h3 font-medium">{label}</span>
                    <span className="ml-auto text-body-sm text-fg-subtle">
                      {handle}
                    </span>
                    <span aria-hidden="true" className="text-fg-muted">
                      &rarr;
                    </span>
                  </a>
                </li>
              ))}
              <li>
                <CopyEmailButton
                  email={siteConfig.contactEmail}
                  className="group flex w-full items-center gap-5 py-5 text-left transition-opacity hover:opacity-80"
                >
                  <MailIcon className="h-5 w-5 shrink-0 text-fg-muted transition-colors group-hover:text-fg" />
                  <span className="text-h3 font-medium">Email</span>
                  <span className="ml-auto hidden text-body-sm text-fg-subtle sm:inline">
                    {siteConfig.contactEmail}
                  </span>
                  <span aria-hidden="true" className="text-fg-muted">
                    &rarr;
                  </span>
                </CopyEmailButton>
              </li>
            </ul>

            <Link
              href="/team"
              className="mt-8 inline-flex items-center gap-2 text-body-sm text-fg underline-offset-4 hover:underline"
            >
              Meet the team
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
