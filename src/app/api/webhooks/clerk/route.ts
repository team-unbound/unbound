import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db";
import { pairingRequests, profiles } from "@/db/schema";

/**
 * Clerk -> Unbound sync.
 *
 * `user.updated` keeps `profiles.email` current the moment a member changes
 * their address in Clerk, rather than waiting for their next page load (see
 * the same-purpose fallback in `requireProfile`, src/lib/auth.ts).
 * `profiles.email` is what gets revealed to the other party on an accepted
 * pairing request, so it matters that it never points at an address the member
 * no longer owns.
 *
 * `user.deleted` erases them from our side. Without it a deleted Clerk account
 * left its profile row in the directory forever, with no way for the person to
 * reach it, which is what the privacy policy now promises does not happen.
 *
 * Register in the Clerk dashboard (Webhooks -> Add endpoint) as:
 *   <your deployed origin>/api/webhooks/clerk
 * e.g. https://beunbound.me/api/webhooks/clerk in production, or an ngrok/
 * Clerk-CLI tunnel URL while testing locally. Subscribe to BOTH `user.updated`
 * and `user.deleted`. Paste the resulting signing secret into
 * CLERK_WEBHOOK_SIGNING_SECRET.
 */
export async function POST(request: NextRequest) {
  let event;
  try {
    // Verifies the Svix signature against CLERK_WEBHOOK_SIGNING_SECRET.
    // Throws (and this handler 400s) on a bad or missing signature — nothing
    // below runs on an unverified request.
    event = await verifyWebhook(request);
  } catch (error) {
    console.error("Clerk webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "user.updated" && event.type !== "user.deleted") {
    // Ack anything we aren't subscribed to rather than 404, so a dashboard
    // misconfiguration doesn't show as a failing delivery.
    return NextResponse.json({ received: true });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json({ received: true, skipped: "no-database" });
  }

  if (event.type === "user.deleted") {
    return handleUserDeleted(event.data.id);
  }

  const user = event.data;
  const primary = user.email_addresses.find(
    (address) => address.id === user.primary_email_address_id,
  );

  // Only a verified address is trustworthy enough to reveal to another member.
  if (!primary || primary.verification?.status !== "verified") {
    return NextResponse.json({ received: true, skipped: "unverified-email" });
  }

  try {
    await getDb()
      .update(profiles)
      .set({ email: primary.email_address, updatedAt: new Date() })
      .where(eq(profiles.clerkUserId, user.id));
  } catch (error) {
    // Report but still 200 — Clerk retries on non-2xx, and retrying a DB
    // hiccup a few times is fine, but this shouldn't page anyone.
    Sentry.captureException(error, { tags: { webhook: "clerk.user.updated" } });
  }

  return NextResponse.json({ received: true });
}

/**
 * Hard-deletes everything we hold for a Clerk user. No soft-delete flag: the
 * row goes.
 *
 * Deleting the profile is enough to take the pairing requests with it. Both
 * `pairing_requests.sender_id` and `.recipient_id` are FKs onto `profiles.id`
 * declared ON DELETE CASCADE, so requests they sent AND requests they received
 * are removed by the same statement. The count is read first purely so the
 * response and the logs say what actually went.
 *
 * Deliberately NOT deleted: `newsletter_subscribers`. That table keys on email
 * with no FK to profiles, and someone can subscribe with no account at all, so
 * an account deletion is not consent to be unsubscribed. The privacy policy
 * says as much and points people at the shared inbox.
 */
async function handleUserDeleted(clerkUserId: string | undefined) {
  // Clerk types the id as optional on deletion events.
  if (!clerkUserId) {
    return NextResponse.json({ received: true, skipped: "no-user-id" });
  }

  const db = getDb();

  try {
    const [existing] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.clerkUserId, clerkUserId))
      .limit(1);

    if (!existing) {
      // Never onboarded, or a redelivery of an event we already handled.
      return NextResponse.json({ received: true, skipped: "no-profile" });
    }

    const doomed = await db
      .select({ id: pairingRequests.id })
      .from(pairingRequests)
      .where(
        // Either side of the pairing, both cascade off the profile delete.
        eq(pairingRequests.senderId, existing.id),
      );
    const received = await db
      .select({ id: pairingRequests.id })
      .from(pairingRequests)
      .where(eq(pairingRequests.recipientId, existing.id));

    const deleted = await db
      .delete(profiles)
      .where(eq(profiles.clerkUserId, clerkUserId))
      .returning({ id: profiles.id });

    console.info(
      `[clerk.user.deleted] removed profile ${existing.id} and ${
        doomed.length + received.length
      } pairing request(s)`,
    );

    return NextResponse.json({
      received: true,
      deletedProfiles: deleted.length,
      deletedPairingRequests: doomed.length + received.length,
    });
  } catch (error) {
    Sentry.captureException(error, { tags: { webhook: "clerk.user.deleted" } });
    // Unlike user.updated, a failure here leaves personal data in the database
    // that someone asked us to erase. 500 so Clerk retries the delivery.
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
