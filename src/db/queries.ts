import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { isRegistrationClosed } from "@/lib/registration";
import { getDb, isDatabaseConfigured } from "./index";
import { events, type UnboundEvent } from "./schema";

export type SplitEvents = {
  upcoming: UnboundEvent[];
  previous: UnboundEvent[];
};

/**
 * Published events split around `now`. A sold-out event goes under Previous
 * even before it starts: there's nothing left to sign up for. Returns empty
 * lists (rather than throwing) while DATABASE_URL is still a placeholder.
 */
export async function getSplitEvents(): Promise<SplitEvents> {
  if (!isDatabaseConfigured) return { upcoming: [], previous: [] };

  const now = new Date();

  // Newest first, which is Previous's order; Upcoming is reversed below.
  const published = await getDb()
    .select()
    .from(events)
    .where(eq(events.isPublished, true))
    .orderBy(desc(events.startsAt));

  const upcoming: UnboundEvent[] = [];
  const previous: UnboundEvent[] = [];
  for (const event of published) {
    const done = event.startsAt < now || isRegistrationClosed(event.slug);
    (done ? previous : upcoming).push(event);
  }

  return { upcoming: upcoming.reverse(), previous };
}

/**
 * A single published event by slug, or null.
 *
 * `past` is resolved here rather than in the page: reading the clock during a
 * component's render is both a lint error and a real hazard, since the value
 * would change between renders of the same request.
 */
export async function getEventBySlug(
  slug: string,
): Promise<(UnboundEvent & { past: boolean }) | null> {
  if (!isDatabaseConfigured) return null;

  const [event] = await getDb()
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.isPublished, true)))
    .limit(1);

  if (!event) return null;
  return { ...event, past: event.startsAt.getTime() < Date.now() };
}
