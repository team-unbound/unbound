/**
 * Inserts the real events the Events page should show.
 * Insert-only and idempotent (existing slugs are skipped) — it never deletes
 * or overwrites anything.
 *
 *   npm run db:seed
 */
import { getDb, isDatabaseConfigured } from "./index";
import { events } from "./schema";

const seedEvents = [
  {
    slug: "unbound-hackathon-2026",
    title: "Unbound Hackathon",
    tagline: "Progress Is Proof.",
    description:
      "Part panel, part sprint. You'll hear from people who build for a living, then get 90 minutes to make something and put it in front of the room. Bring an idea or pick one up when you get there — the point is having something to show by four, not having it figured out beforehand. Presented by Unbound, as part of Waterloo Tech Week.",
    location: "E7 Engineering, University of Waterloo",
    imageUrl: "/events/event1.jpeg",
    // Noon to 4pm Eastern on Saturday 12 September 2026, stored as UTC.
    startsAt: new Date("2026-09-12T16:00:00Z"),
    endsAt: new Date("2026-09-12T20:00:00Z"),
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
    .values(seedEvents)
    .onConflictDoNothing({ target: events.slug })
    .returning({ slug: events.slug });

  console.log(
    inserted.length > 0
      ? `Inserted ${inserted.length} event(s): ${inserted.map((e) => e.slug).join(", ")}`
      : "Nothing to insert — every event already exists.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
