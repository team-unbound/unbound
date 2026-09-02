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
      className={`flex h-full flex-col bg-canvas p-8 lg:p-10 ${past ? "text-fg-muted" : ""}`}
    >
      <time
        dateTime={toDateTimeAttr(event.startsAt)}
        className="font-mono text-body-sm text-fg-subtle"
      >
        {formatEventDate(event.startsAt)}
      </time>

      <h3
        className={`mt-5 text-h3 font-medium text-balance ${past ? "text-fg-muted" : "text-fg"}`}
      >
        {event.title}
      </h3>

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
    </article>
  );
}
