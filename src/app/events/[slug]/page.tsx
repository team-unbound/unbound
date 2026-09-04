import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventSignupForm } from "@/components/events/event-signup-form";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { getEventBySlug } from "@/db/queries";
import {
  formatEventDate,
  formatEventTime,
  toDateTimeAttr,
} from "@/lib/format";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event" };

  return {
    title: event.title,
    description: event.tagline ?? event.description ?? undefined,
    openGraph: event.imageUrl ? { images: [event.imageUrl] } : undefined,
  };
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-t border-line py-4">
      <dt className="w-24 shrink-0 text-body-sm text-fg-subtle">{label}</dt>
      <dd className="text-body-sm text-fg-muted">{children}</dd>
    </div>
  );
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  return (
    <Section className="pt-32 lg:pt-40">
      <Reveal>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 py-2 text-body-sm text-fg-muted transition-colors hover:text-fg"
        >
          <span aria-hidden="true">&larr;</span> All events
        </Link>
      </Reveal>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
        <Reveal className="min-w-0">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt=""
              width={1200}
              height={1200}
              priority
              sizes="(min-width: 1024px) 44rem, 100vw"
              className="w-full rounded-2xl border border-line"
            />
          ) : null}

          <time
            dateTime={toDateTimeAttr(event.startsAt)}
            className="mt-10 block font-mono text-body-sm text-fg-subtle"
          >
            {formatEventDate(event.startsAt)}
          </time>

          <h1 className="mt-4 text-h1 font-medium text-balance">
            {event.title}
          </h1>

          {event.tagline ? (
            <p className="mt-4 text-h3 text-fg-muted">{event.tagline}</p>
          ) : null}

          {event.description ? (
            <p className="mt-8 max-w-2xl text-body-lg text-fg-muted text-pretty">
              {event.description}
            </p>
          ) : null}

          <dl className="mt-10 max-w-xl border-b border-line">
            <Detail label="When">
              {formatEventDate(event.startsAt)}, {formatEventTime(event.startsAt)}
              {event.endsAt ? ` — ${formatEventTime(event.endsAt)}` : ""}
            </Detail>
            {event.location ? (
              <Detail label="Where">{event.location}</Detail>
            ) : null}
            <Detail label="Cost">Free</Detail>
          </dl>
        </Reveal>

        <Reveal delay={0.08} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          {event.past ? (
            <div className="rounded-2xl border border-dashed border-line p-8 text-center lg:p-10">
              <p className="text-body-sm text-fg-muted text-pretty">
                This one has already happened.{" "}
                <Link
                  href="/newsletter"
                  className="text-fg underline underline-offset-4"
                >
                  Join the newsletter
                </Link>{" "}
                and you&rsquo;ll hear about the next one first.
              </p>
            </div>
          ) : (
            <EventSignupForm eventId={event.id} eventTitle={event.title} />
          )}
        </Reveal>
      </div>
    </Section>
  );
}
