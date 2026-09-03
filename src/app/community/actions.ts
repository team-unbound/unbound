"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { pairingRequests, profiles } from "@/db/schema";
import { requireProfile } from "@/lib/auth";
import { checkRateLimit, retryAfterLabel } from "@/lib/rate-limit";
import {
  cancelPairingRequestSchema,
  fieldErrorsFrom,
  pairingRequestSchema,
  pairingResponseSchema,
} from "@/lib/validation";

export type PairingFormState =
  | { status: "idle" }
  | { status: "success"; recipientName: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

/**
 * Send a pairing request.
 *
 * The sender is the session's profile — the form cannot name a different one.
 * The recipient id from the form is treated as untrusted and re-checked
 * against the database before any write.
 */
export async function sendPairingRequest(
  _prev: PairingFormState,
  formData: FormData,
): Promise<PairingFormState> {
  const sender = await requireProfile();

  const limit = await checkRateLimit("pairing", sender.id);
  if (!limit.success) {
    return {
      status: "error",
      message: `You've sent a lot of requests. Try again ${retryAfterLabel(limit.retryAfter)}.`,
    };
  }

  const parsed = pairingRequestSchema.safeParse({
    recipientProfileId: String(formData.get("recipientProfileId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const { recipientProfileId, reason } = parsed.data;

  if (recipientProfileId === sender.id) {
    return { status: "error", message: "You can't pair with yourself." };
  }

  // Recipient must exist, be onboarded, and still be open to pairing.
  const [recipient] = await getDb()
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      openToPairing: profiles.openToPairing,
    })
    .from(profiles)
    .where(
      and(
        eq(profiles.id, recipientProfileId),
        isNotNull(profiles.onboardedAt),
      ),
    )
    .limit(1);

  if (!recipient) {
    return { status: "error", message: "That member no longer exists." };
  }
  if (!recipient.openToPairing) {
    return {
      status: "error",
      message: `${recipient.fullName} isn't taking pairing requests right now.`,
    };
  }

  try {
    const inserted = await getDb()
      .insert(pairingRequests)
      .values({ senderId: sender.id, recipientId: recipient.id, reason })
      // The partial unique index allows only one *pending* request per
      // direction; a duplicate quietly does nothing.
      .onConflictDoNothing()
      .returning({ id: pairingRequests.id });

    if (inserted.length === 0) {
      return {
        status: "error",
        message: "You already have a request pending with them.",
      };
    }
  } catch (error) {
    console.error("sendPairingRequest failed", error);
    return {
      status: "error",
      message: "Couldn't send that request. Please try again.",
    };
  }

  revalidatePath("/community");
  revalidatePath("/dashboard");
  return { status: "success", recipientName: recipient.fullName };
}

export type RespondState =
  | { status: "idle" }
  | { status: "success"; decision: "accepted" | "declined" }
  | { status: "error"; message: string };

/**
 * Accept or decline a request addressed to the signed-in user.
 *
 * Ownership is part of the UPDATE's WHERE clause rather than a separate read,
 * so there's no window between checking and writing: a request that isn't
 * yours, or isn't pending, matches zero rows and changes nothing.
 */
export async function respondToPairingRequest(
  _prev: RespondState,
  formData: FormData,
): Promise<RespondState> {
  const responder = await requireProfile();

  const limit = await checkRateLimit("pairingRespond", responder.id);
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many responses at once. Try again ${retryAfterLabel(limit.retryAfter)}.`,
    };
  }

  const parsed = pairingResponseSchema.safeParse({
    requestId: String(formData.get("requestId") ?? ""),
    decision: String(formData.get("decision") ?? ""),
  });

  if (!parsed.success) {
    return { status: "error", message: "That request couldn't be processed." };
  }

  const { requestId, decision } = parsed.data;

  const updated = await getDb()
    .update(pairingRequests)
    .set({ status: decision, respondedAt: new Date() })
    .where(
      and(
        eq(pairingRequests.id, requestId),
        // Only the recipient may respond...
        eq(pairingRequests.recipientId, responder.id),
        // ...and only while it's still pending.
        eq(pairingRequests.status, "pending"),
      ),
    )
    .returning({ id: pairingRequests.id });

  if (updated.length === 0) {
    // Same message either way: don't confirm whether the id exists.
    return {
      status: "error",
      message: "That request is no longer waiting on you.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/community");
  return { status: "success", decision };
}

export type CancelState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

/**
 * Cancel a request the signed-in user sent, while it's still pending.
 *
 * Same ownership-in-the-WHERE-clause pattern as respondToPairingRequest, but
 * mirrored onto the sender side: sender_id must match the session's profile
 * and status must still be 'pending', or zero rows match and nothing happens.
 * The row is deleted outright (not marked with a status) so the sender is
 * free to send a fresh request afterward — cancelling and declining are
 * different actions on different sides of the request, and don't share a
 * "cancelled" status in the enum.
 */
export async function cancelPairingRequest(
  _prev: CancelState,
  formData: FormData,
): Promise<CancelState> {
  const sender = await requireProfile();

  const limit = await checkRateLimit("pairingRespond", sender.id);
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many changes at once. Try again ${retryAfterLabel(limit.retryAfter)}.`,
    };
  }

  const parsed = cancelPairingRequestSchema.safeParse({
    requestId: String(formData.get("requestId") ?? ""),
  });

  if (!parsed.success) {
    return { status: "error", message: "That request couldn't be found." };
  }

  const deleted = await getDb()
    .delete(pairingRequests)
    .where(
      and(
        eq(pairingRequests.id, parsed.data.requestId),
        // Only the sender may cancel...
        eq(pairingRequests.senderId, sender.id),
        // ...and only while it's still pending.
        eq(pairingRequests.status, "pending"),
      ),
    )
    .returning({ id: pairingRequests.id });

  if (deleted.length === 0) {
    return {
      status: "error",
      message: "That request can't be cancelled anymore.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/community");
  return { status: "success" };
}
