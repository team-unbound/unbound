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
