import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { WAITLIST_PATH } from "@/lib/waitlist";

/** The app-waitlist call to action, identical wherever it appears. */
export function WaitlistCta() {
  return (
    <Section className="border-t border-line">
      <Reveal className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
        <h2 className="max-w-xl text-h2 font-medium text-balance">
          get early access to the app
        </h2>
        <Link
          href={WAITLIST_PATH}
          className="rounded-full bg-fg px-7 py-3 text-body-sm font-medium text-canvas transition-opacity hover:opacity-85"
        >
          Join the waitlist
        </Link>
      </Reveal>
    </Section>
  );
}
