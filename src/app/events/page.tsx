import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/events/event-card";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { getSplitEvents } from "@/db/queries";
import type { UnboundEvent } from "@/db/schema";
import { siteConfig } from "@/lib/site";
import { CopyEmailButton } from "@/components/ui/copy-email-button";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Workshops, build nights and demo sessions from the Unbound community.",
};

// Events change on their own schedule; don't serve a stale list forever.
export const revalidate = 300;

function EventGrid({
  events,
  past,
}: {
  events: UnboundEvent[];
  past?: boolean;
}) {
  return (
    <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event, i) => (
        <Reveal key={event.id} delay={i * 0.06} className="bg-canvas">
          <EventCard event={event} past={past} />
        </Reveal>
      ))}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center">
      <p className="text-body-sm text-fg-muted text-pretty">{children}</p>
    </div>
  );
}

export default async function EventsPage() {
  const { upcoming, previous } = await getSplitEvents();

  return (
    <>
      <Section className="pt-40 pb-0 lg:pt-48 lg:pb-0">
        <Reveal>
          <span className="eyebrow">Events</span>
          <h1 className="mt-8 max-w-[18ch] text-h1 font-medium text-balance">
            Small rooms. People who actually build.
          </h1>
          <p className="mt-6 max-w-xl text-body-lg text-fg-muted text-pretty">
            Workshops, build nights and demo sessions. Come with something
            half-finished — that&rsquo;s the point.
          </p>
        </Reveal>
      </Section>

      <Section>
        <Reveal className="flex items-baseline justify-between gap-4">
          <h2 className="text-h2 font-medium">Upcoming</h2>
          <span className="font-mono text-body-sm text-fg-subtle">
            {String(upcoming.length).padStart(2, "0")}
          </span>
        </Reveal>

        {upcoming.length > 0 ? (
          <EventGrid events={upcoming} />
        ) : (
          <EmptyState>
            Nothing on the calendar right now.{" "}
            <Link
              href="/newsletter"
              className="text-fg underline underline-offset-4"
            >
              Join the newsletter
            </Link>{" "}
            and you&rsquo;ll hear about the next one first.
          </EmptyState>
        )}
      </Section>

      <Section className="border-t border-line">
        <Reveal className="flex items-baseline justify-between gap-4">
          <h2 className="text-h2 font-medium text-fg-muted">Previous</h2>
          <span className="font-mono text-body-sm text-fg-subtle">
            {String(previous.length).padStart(2, "0")}
          </span>
        </Reveal>

        {previous.length > 0 ? (
          <EventGrid events={previous} past />
        ) : (
          <EmptyState>
            No past events yet, we&rsquo;re just getting started.{" "}
            <CopyEmailButton
              email={siteConfig.contactEmail}
              className="text-fg underline underline-offset-4"
            >
              Pitch us one
            </CopyEmailButton>
            .
          </EmptyState>
        )}
      </Section>
    </>
  );
}
