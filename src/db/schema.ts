import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Profiles — one row per Clerk user, created by the onboarding flow.  */
/* ------------------------------------------------------------------ */

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Clerk's user id (`user_...`) — the link back to the auth provider. */
    clerkUserId: text("clerk_user_id").notNull().unique(),
    /** Never rendered publicly; revealed only on an accepted pairing request. */
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    gradeYear: text("grade_year"),
    school: text("school"),
    bio: text("bio"),
    funFacts: text("fun_facts"),
    /** Free-form skill/interest tags, kept inline rather than in a join table. */
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    /** Profession / what they're building. */
    profession: text("profession"),
    openToPairing: boolean("open_to_pairing").notNull().default(true),
    avatarUrl: text("avatar_url"),
    /** Null until the onboarding form is completed. */
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("profiles_onboarded_at_idx").on(table.onboardedAt),
    index("profiles_open_to_pairing_idx").on(table.openToPairing),
  ],
);

/* ------------------------------------------------------------------ */
/* Newsletter                                                          */
/* ------------------------------------------------------------------ */

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Case-insensitive uniqueness, so Foo@x.com can't resubscribe as foo@x.com.
    uniqueIndex("newsletter_subscribers_email_lower_idx").on(
      sql`lower(${table.email})`,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    /** Short line under the title, e.g. "Progress Is Proof." */
    tagline: text("tagline"),
    description: text("description"),
    location: text("location"),
    /** Path under /public, or an absolute URL. Used as the card + header art. */
    imageUrl: text("image_url"),
    /** Upcoming vs. previous is derived from this against `now()`. */
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("events_starts_at_idx").on(table.startsAt)],
);

/* ------------------------------------------------------------------ */
/* Event signups                                                       */
/*                                                                     */
/* Deliberately not hung off `profiles`: anyone can sign up for an     */
/* event without an Unbound account, so the only identity here is the  */
/* name and address they typed.                                        */
/* ------------------------------------------------------------------ */

export const eventSignups = pgTable(
  "event_signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    /** Plain demographic figure, not a date of birth. */
    age: integer("age").notNull(),
    gradeYear: text("grade_year").notNull(),
    /**
     * The commitment checkbox, recorded the same way as any other consent:
     * the fact and the moment, separately from the row's own timestamp. It is
     * NOT NULL and the action refuses to insert it as false, so a row's
     * existence is itself evidence the box was ticked.
     */
    committed: boolean("committed").notNull(),
    committedAt: timestamp("committed_at", { withTimezone: true }).notNull(),
    /** When the signup was submitted. */
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("event_signups_committed", sql`${table.committed}`),
    check("event_signups_age_range", sql`${table.age} BETWEEN 10 AND 120`),
    // One signup per address per event; case-insensitive, so Foo@x.com and
    // foo@x.com can't both take a seat.
    uniqueIndex("event_signups_event_email_lower_idx").on(
      table.eventId,
      sql`lower(${table.email})`,
    ),
    index("event_signups_event_idx").on(table.eventId, table.createdAt),
  ],
);

/* ------------------------------------------------------------------ */
/* Pairing requests                                                    */
/* ------------------------------------------------------------------ */

export const pairingStatusEnum = pgEnum("pairing_status", [
  "pending",
  "accepted",
  "declined",
]);

export const pairingRequests = pgTable(
  "pairing_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    /** Required: why they want to pair up. */
    reason: text("reason").notNull(),
    status: pairingStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Set when the recipient accepts or declines. */
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    check("pairing_requests_no_self", sql`${table.senderId} <> ${table.recipientId}`),
    // At most one *open* request per direction; a declined one can be retried.
    uniqueIndex("pairing_requests_one_pending_idx")
      .on(table.senderId, table.recipientId)
      .where(sql`status = 'pending'`),
    index("pairing_requests_recipient_idx").on(table.recipientId, table.status),
    index("pairing_requests_sender_idx").on(table.senderId, table.status),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type UnboundEvent = typeof events.$inferSelect;
export type EventSignup = typeof eventSignups.$inferSelect;
export type NewEventSignup = typeof eventSignups.$inferInsert;
export type PairingRequest = typeof pairingRequests.$inferSelect;
export type PairingStatus = (typeof pairingStatusEnum.enumValues)[number];
