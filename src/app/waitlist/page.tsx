import type { Metadata } from "next";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";

export const metadata: Metadata = {
  title: "Waitlist",
};

export default function WaitlistPage() {
  return (
    <Section className="pt-40 lg:pt-48">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal>
          <h1 className="text-h1 font-medium text-balance">
            the app&apos;s coming. get on the list.
          </h1>
          <p className="mt-6 max-w-md text-body-lg text-fg-muted text-pretty">
            a place for people who are building and still figuring it out. tell
            us a bit about you and we&apos;ll hit you up when it&apos;s live.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <WaitlistForm />
        </Reveal>
      </div>
    </Section>
  );
}
