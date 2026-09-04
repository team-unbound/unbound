import Image from "next/image";
import Link from "next/link";
import type { UnboundEvent } from "@/db/schema";
import {
  formatEventDate,
  formatEventTime,
  toDateTimeAttr,
} from "@/lib/format";

export function EventCard({
  event,
  past = false,
}: {
  event: UnboundEvent;
  past?: boolean;
}) {
  return (
    <article
      className={`group relative flex h-full flex-col bg-canvas p-8 break-words lg:p-10 ${past ? "text-fg-muted" : ""}`}
    >
      {event.imageUrl ? (
        <Image
          src={event.imageUrl}
          alt=""
          width={1200}
          height={1200}
          sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
          className={`mb-8 w-full rounded-lg border border-line ${past ? "opacity-60" : ""}`}
        />
      ) : null}

      <time
        dateTime={toDateTimeAttr(event.startsAt)}
        className="font-mono text-body-sm text-fg-subtle"
      >
        {formatEventDate(event.startsAt)}
      </time>

      <h3
        className={`mt-5 text-h3 font-medium text-balance ${past ? "text-fg-muted" : "text-fg"}`}
      >
        {/* Stretched link: the whole card is the hit area, which matters far
            more on a phone than a text-sized target does. */}
        <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0">
          {event.title}
        </Link>
      </h3>

      {event.tagline ? (
        <p className="mt-2 text-body-sm text-fg-subtle">{event.tagline}</p>
      ) : null}

      {event.description ? (
        <p className="mt-3 flex-1 text-body-sm text-fg-muted text-pretty">
          {event.description}
        </p>
      ) : (
        <div className="flex-1" />
      )}

      <dl className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-body-sm">
        <div className="flex gap-3">
          <dt className="w-20 shrink-0 text-fg-subtle">Time</dt>
          <dd className="text-fg-muted">{formatEventTime(event.startsAt)}</dd>
        </div>
        {event.location ? (
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-fg-subtle">Where</dt>
            <dd className="text-fg-muted">{event.location}</dd>
          </div>
        ) : null}
      </dl>

      <span
        aria-hidden="true"
        className="mt-6 inline-flex items-center gap-2 text-body-sm text-fg underline-offset-4 group-hover:underline"
      >
        {past ? "See details" : "Sign up"} <span>&rarr;</span>
      </span>
    </article>
  );
}
