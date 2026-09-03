import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import { NextResponse, type NextRequest } from "next/server";
import { getDb, isDatabaseConfigured } from "@/db";
import { profiles } from "@/db/schema";

/**
 * Clerk -> Unbound sync.
 *
 * Keeps `profiles.email` current the moment a member changes their address in
 * Clerk, rather than waiting for their next page load (see the same-purpose
 * fallback in `requireProfile`, src/lib/auth.ts). `profiles.email` is what
 * gets revealed to the other party on an accepted pairing request, so it
 * matters that it never points at an address the member no longer owns.
 *
 * Register in the Clerk dashboard (Webhooks -> Add endpoint) as:
 *   <your deployed origin>/api/webhooks/clerk
 * e.g. https://beunbound.me/api/webhooks/clerk in production, or an ngrok/
 * Clerk-CLI tunnel URL while testing locally. Subscribe to `user.updated`.
 * Paste the resulting signing secret into CLERK_WEBHOOK_SIGNING_SECRET.
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

  if (event.type !== "user.updated") {
    // Only subscribed to user.updated, but ack anything else rather than 404
    // so a dashboard misconfiguration doesn't show as a failing delivery.
    return NextResponse.json({ received: true });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json({ received: true, skipped: "no-database" });
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
