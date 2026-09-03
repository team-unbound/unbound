import "server-only";
import { and, desc, eq, isNotNull, ne, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "./index";
import { pairingRequests, profiles } from "./schema";

/**
 * Columns safe to show to any signed-in member.
 *
 * Selected explicitly (never `select()` with no argument) so `email` can't be
 * carried into a public payload by accident when the schema grows.
 */
const publicProfileColumns = {
  id: profiles.id,
  fullName: profiles.fullName,
  gradeYear: profiles.gradeYear,
  school: profiles.school,
  bio: profiles.bio,
  funFacts: profiles.funFacts,
  tags: profiles.tags,
  profession: profiles.profession,
  openToPairing: profiles.openToPairing,
  avatarUrl: profiles.avatarUrl,
  createdAt: profiles.createdAt,
} as const;

export type PublicProfile = {
  id: string;
  fullName: string;
  gradeYear: string | null;
  school: string | null;
  bio: string | null;
  funFacts: string | null;
  tags: string[];
  profession: string | null;
  openToPairing: boolean;
  avatarUrl: string | null;
  createdAt: Date;
};

/** How the viewer currently stands with a given profile. */
export type ViewerRelation =
  | "self"
  | "none"
  | "outgoing-pending"
  | "incoming-pending"
  | "accepted"
  | "declined";

export type CommunityProfile = PublicProfile & { relation: ViewerRelation };

/**
 * Every onboarded member, annotated with the viewer's relationship to them.
 * No email is selected anywhere in this query.
 */
export async function getCommunityProfiles(
  viewerProfileId: string,
): Promise<CommunityProfile[]> {
  const db = getDb();

  const [rows, related] = await Promise.all([
    db
      .select(publicProfileColumns)
      .from(profiles)
      .where(isNotNull(profiles.onboardedAt))
      .orderBy(desc(profiles.onboardedAt)),
    db
      .select({
        senderId: pairingRequests.senderId,
        recipientId: pairingRequests.recipientId,
        status: pairingRequests.status,
      })
      .from(pairingRequests)
      .where(
        or(
          eq(pairingRequests.senderId, viewerProfileId),
          eq(pairingRequests.recipientId, viewerProfileId),
        ),
      ),
  ]);

  const relationByProfile = new Map<string, ViewerRelation>();
  for (const row of related) {
    const otherId =
      row.senderId === viewerProfileId ? row.recipientId : row.senderId;
    const outgoing = row.senderId === viewerProfileId;

    let relation: ViewerRelation;
    if (row.status === "accepted") relation = "accepted";
    else if (row.status === "declined") relation = "declined";
    else relation = outgoing ? "outgoing-pending" : "incoming-pending";

    // An accepted pairing outranks any older declined row for the same pair.
    const existing = relationByProfile.get(otherId);
    if (existing === "accepted") continue;
    relationByProfile.set(otherId, relation);
  }

  return rows.map((row) => ({
    ...row,
    relation:
      row.id === viewerProfileId
        ? "self"
        : (relationByProfile.get(row.id) ?? "none"),
  }));
}

/** A single member's public card, or null. */
export async function getPublicProfile(
  profileId: string,
): Promise<PublicProfile | null> {
  const [row] = await getDb()
    .select(publicProfileColumns)
    .from(profiles)
    .where(and(eq(profiles.id, profileId), isNotNull(profiles.onboardedAt)))
    .limit(1);
  return row ?? null;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

const senderProfile = alias(profiles, "sender_profile");
const recipientProfile = alias(profiles, "recipient_profile");

export type IncomingRequest = {
  id: string;
  reason: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  senderId: string;
  senderName: string;
  senderProfession: string | null;
  senderSchool: string | null;
  /** Non-null ONLY when this request is accepted. */
  senderEmail: string | null;
};

export type OutgoingRequest = {
  id: string;
  reason: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  recipientId: string;
  recipientName: string;
  recipientProfession: string | null;
  /** Non-null ONLY when this request is accepted. */
  recipientEmail: string | null;
};

/**
 * Email reveal rule, enforced in SQL rather than in the view layer:
 * the counterpart's email is selected as NULL unless the row's status is
 * 'accepted'. Combined with the WHERE clause scoping rows to the viewer, an
 * email can only ever reach the two parties to an accepted request.
 */
export async function getIncomingRequests(
  viewerProfileId: string,
): Promise<IncomingRequest[]> {
  return getDb()
    .select({
      id: pairingRequests.id,
      reason: pairingRequests.reason,
      status: pairingRequests.status,
      createdAt: pairingRequests.createdAt,
      senderId: senderProfile.id,
      senderName: senderProfile.fullName,
      senderProfession: senderProfile.profession,
      senderSchool: senderProfile.school,
      senderEmail: sql<
        string | null
      >`case when ${pairingRequests.status} = 'accepted' then ${senderProfile.email} else null end`,
    })
    .from(pairingRequests)
    .innerJoin(senderProfile, eq(senderProfile.id, pairingRequests.senderId))
    .where(eq(pairingRequests.recipientId, viewerProfileId))
    .orderBy(desc(pairingRequests.createdAt));
}

export async function getOutgoingRequests(
  viewerProfileId: string,
): Promise<OutgoingRequest[]> {
  return getDb()
    .select({
      id: pairingRequests.id,
      reason: pairingRequests.reason,
      status: pairingRequests.status,
      createdAt: pairingRequests.createdAt,
      recipientId: recipientProfile.id,
      recipientName: recipientProfile.fullName,
      recipientProfession: recipientProfile.profession,
      recipientEmail: sql<
        string | null
      >`case when ${pairingRequests.status} = 'accepted' then ${recipientProfile.email} else null end`,
    })
    .from(pairingRequests)
    .innerJoin(
      recipientProfile,
      eq(recipientProfile.id, pairingRequests.recipientId),
    )
    .where(eq(pairingRequests.senderId, viewerProfileId))
    .orderBy(desc(pairingRequests.createdAt));
}

/** Members the viewer can actually send a request to right now. */
export async function countPairableMembers(
  viewerProfileId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(profiles)
    .where(
      and(
        isNotNull(profiles.onboardedAt),
        eq(profiles.openToPairing, true),
        ne(profiles.id, viewerProfileId),
      ),
    );
  return row?.count ?? 0;
}
