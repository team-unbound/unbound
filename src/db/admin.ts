import "server-only";
import { count, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "./index";
import {
  events,
  newsletterSubscribers,
  pairingRequests,
  profiles,
  waitlistSignups,
} from "./schema";
import { requireAdmin } from "@/lib/auth";

/**
 * Admin-only reads.
 *
 * The gate lives here as well as on the page, so these can never be called
 * from a new route without an admin check. `requireAdmin` 404s for signed-in
 * non-admins.
 */

const senderProfile = alias(profiles, "admin_sender");
const recipientProfile = alias(profiles, "admin_recipient");

const LIMIT = 200;

export async function getAdminTables() {
  await requireAdmin();
  const db = getDb();

  const [members, subscribers, eventRows, requests, waitlist, [waitlistTotal]] =
    await Promise.all([
      db
        .select({
          id: profiles.id,
          fullName: profiles.fullName,
          email: profiles.email,
          school: profiles.school,
          gradeYear: profiles.gradeYear,
          profession: profiles.profession,
          openToPairing: profiles.openToPairing,
          onboardedAt: profiles.onboardedAt,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .orderBy(desc(profiles.createdAt))
        .limit(LIMIT),

      db
        .select({
          id: newsletterSubscribers.id,
          email: newsletterSubscribers.email,
          firstName: newsletterSubscribers.firstName,
          lastName: newsletterSubscribers.lastName,
          createdAt: newsletterSubscribers.createdAt,
        })
        .from(newsletterSubscribers)
        .orderBy(desc(newsletterSubscribers.createdAt))
        .limit(LIMIT),

      db
        .select({
          id: events.id,
          title: events.title,
          slug: events.slug,
          location: events.location,
          startsAt: events.startsAt,
          isPublished: events.isPublished,
        })
        .from(events)
        .orderBy(desc(events.startsAt))
        .limit(LIMIT),

      db
        .select({
          id: pairingRequests.id,
          reason: pairingRequests.reason,
          status: pairingRequests.status,
          createdAt: pairingRequests.createdAt,
          respondedAt: pairingRequests.respondedAt,
          senderName: senderProfile.fullName,
          recipientName: recipientProfile.fullName,
        })
        .from(pairingRequests)
        .innerJoin(senderProfile, eq(senderProfile.id, pairingRequests.senderId))
        .innerJoin(
          recipientProfile,
          eq(recipientProfile.id, pairingRequests.recipientId),
        )
        .orderBy(desc(pairingRequests.createdAt))
        .limit(LIMIT),

      db
        .select()
        .from(waitlistSignups)
        .orderBy(desc(waitlistSignups.createdAt))
        .limit(LIMIT),

      // The real total, since the rows above stop at LIMIT.
      db.select({ value: count() }).from(waitlistSignups),
    ]);

  return {
    members,
    subscribers,
    events: eventRows,
    requests,
    waitlist,
    waitlistTotal: waitlistTotal?.value ?? 0,
  };
}

/** Every waitlist row, newest first, for the CSV export. Not capped. */
export async function getAllWaitlistSignups() {
  await requireAdmin();
  return getDb()
    .select()
    .from(waitlistSignups)
    .orderBy(desc(waitlistSignups.createdAt));
}

export type AdminTables = Awaited<ReturnType<typeof getAdminTables>>;
