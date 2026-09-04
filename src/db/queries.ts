import "server-only";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "./index";
import { events, type UnboundEvent } from "./schema";

export type SplitEvents = {
  upcoming: UnboundEvent[];
  previous: UnboundEvent[];
};

/**
 * Published events split around `now`. Returns empty lists (rather than
 * throwing) while DATABASE_URL is still a placeholder.
 */
export async function getSplitEvents(): Promise<SplitEvents> {
  if (!isDatabaseConfigured) return { upcoming: [], previous: [] };

  const db = getDb();
  const now = new Date();

  const [upcoming, previous] = await Promise.all([
    db
      .select()
      .from(events)
      .where(and(eq(events.isPublished, true), gte(events.startsAt, now)))
      .orderBy(asc(events.startsAt)),
    db
      .select()
      .from(events)
      .where(and(eq(events.isPublished, true), lt(events.startsAt, now)))
      .orderBy(desc(events.startsAt)),
  ]);

  return { upcoming, previous };
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
