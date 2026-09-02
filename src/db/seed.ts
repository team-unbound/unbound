/**
 * Inserts a few example events so the Events page has something to show.
 * Insert-only and idempotent (existing slugs are skipped) — it never deletes
 * or overwrites anything.
 *
 *   npm run db:seed
 */
import { getDb, isDatabaseConfigured } from "./index";
import { events } from "./schema";

function daysFromNow(days: number, hour = 18) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

const sampleEvents = [
  {
    slug: "build-night-01",
    title: "Build Night 01",
    description:
      "Three hours, one table, whatever you're working on. Bring the half-finished thing and leave with it further along.",
    location: "Toronto — venue TBC",
    startsAt: daysFromNow(21),
    endsAt: daysFromNow(21, 21),
  },
  {
    slug: "founder-teardown",
    title: "Founder Teardown",
    description:
      "Two members put their product in front of the room and take honest questions. No pitch decks.",
    location: "Online",
    startsAt: daysFromNow(38),
    endsAt: daysFromNow(38, 20),
  },
  {
    slug: "unbound-kickoff",
    title: "Unbound Kickoff",
    description:
      "The first one. Introductions, what we're each building, and what this community should become.",
    location: "Toronto",
    startsAt: daysFromNow(-30),
    endsAt: daysFromNow(-30, 21),
  },
];

async function main() {
  if (!isDatabaseConfigured) {
    console.error(
      "DATABASE_URL is not set. Add your Neon connection string to .env.local first.",
    );
    process.exit(1);
  }

  const inserted = await getDb()
    .insert(events)
    .values(sampleEvents)
    .onConflictDoNothing({ target: events.slug })
    .returning({ slug: events.slug });

  console.log(
    inserted.length > 0
      ? `Inserted ${inserted.length} event(s): ${inserted.map((e) => e.slug).join(", ")}`
      : "Nothing to insert — all sample events already exist.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
