import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { isAdminEmail } from "./admin";

/**
 * Server-side identity helpers.
 *
 * Rule for every mutation: the acting user is derived from the Clerk session
 * here — never from anything the client sent. Client-supplied ids are only
 * ever used to name the *target* of an action, and are always re-checked
 * against the session-derived profile before the write happens.
 */

/** Clerk user id for the current session, or null when signed out. */
export async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/** Clerk user id, or redirect to sign-in. */
export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) redirect("/sign-in");
  return userId;
}

/**
 * The session user's *verified* primary email.
 *
 * Verification matters: an unverified address could otherwise be added to an
 * account to impersonate an admin.
 */
export async function getVerifiedPrimaryEmail(): Promise<string | null> {
  const user = await currentUser();
  if (!user?.primaryEmailAddressId) return null;

  const primary = user.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId,
  );
  if (!primary) return null;
  if (primary.verification?.status !== "verified") return null;

  return primary.emailAddress;
}

/** The current user's profile row, or null if they haven't onboarded. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const [profile] = await getDb()
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  return profile ?? null;
}

/**
 * The current user's completed profile, or a redirect: to sign-in when signed
 * out, to onboarding when the profile doesn't exist yet.
 *
 * Also re-syncs the stored email from Clerk. `profiles.email` is what gets
 * revealed on an accepted pairing request, so it must not drift after someone
 * changes their address in Clerk. A `user.updated` webhook would catch this
 * immediately; this covers it on the member's next visit.
 */
export async function requireProfile(): Promise<Profile> {
  await requireUserId();
  const profile = await getCurrentProfile();
  if (!profile || !profile.onboardedAt) redirect("/onboarding");

  const email = await getVerifiedPrimaryEmail();
  if (email && email !== profile.email) {
    await getDb()
      .update(profiles)
      .set({ email, updatedAt: new Date() })
      .where(eq(profiles.id, profile.id));
    return { ...profile, email };
  }

  return profile;
}

/** True when the session belongs to an allowlisted admin. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const userId = await getUserId();
  if (!userId) return false;
  return isAdminEmail(await getVerifiedPrimaryEmail());
}

/**
 * Gate for admin-only pages and actions. Signed-out users go to sign-in;
 * signed-in non-admins get a 404 so the route's existence isn't confirmed.
 */
export async function requireAdmin(): Promise<string> {
  const userId = await requireUserId();
  if (!isAdminEmail(await getVerifiedPrimaryEmail())) {
    const { notFound } = await import("next/navigation");
    notFound();
  }
  return userId;
}
