"use server";

import { getDb, isDatabaseConfigured } from "@/db";
import { eventSignups, events } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { checkRateLimit, getClientIp, retryAfterLabel } from "@/lib/rate-limit";
import { checkboxToBoolean, eventSignupSchema, fieldErrorsFrom } from "@/lib/validation";

export type EventSignupState =
  | { status: "idle" }
  | { status: "success"; fullName: string; email: string }
  | { status: "already"; email: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export async function signUpForEvent(
  _prev: EventSignupState,
  formData: FormData,
): Promise<EventSignupState> {
  // Anonymous endpoint — no Clerk session to key on, so the caller's IP is it.
  const ip = await getClientIp();
  const limit = await checkRateLimit("eventSignup", ip);
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many signups from this connection. Try again ${retryAfterLabel(limit.retryAfter)}.`,
    };
  }

  const parsed = eventSignupSchema.safeParse({
    eventId: String(formData.get("eventId") ?? ""),
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    age: String(formData.get("age") ?? "").trim(),
    gradeYear: String(formData.get("gradeYear") ?? "").trim(),
    committed: checkboxToBoolean(formData.get("committed")),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  if (!isDatabaseConfigured) {
    return {
      status: "error",
      message: "Signups aren't live yet. The database isn't connected.",
    };
  }

  const { eventId, fullName, email, age, gradeYear } = parsed.data;
  const db = getDb();

  // The id comes from a hidden field, so re-check it names a real published
  // event rather than trusting the form. Without this a crafted post could
  // attach signups to an unpublished event, or to any uuid at all.
  const [event] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.isPublished, true)))
    .limit(1);

  if (!event) {
    return { status: "error", message: "That event isn't open for signups." };
  }

  // One moment for both timestamps: the box was ticked as part of this submit,
  // so recording a different time for each would be inventing precision.
  const now = new Date();

  let inserted: { id: string }[];
  try {
    inserted = await db
      .insert(eventSignups)
      .values({
        eventId: event.id,
        fullName,
        email,
        age,
        gradeYear,
        // parsed.data.committed is the literal `true`; nothing else parses.
        committed: true,
        committedAt: now,
        createdAt: now,
      })
      // Conflicts on (event_id, lower(email)). Deliberately not an update: a
      // second submit on a known address must not be able to overwrite the
      // details the real owner gave us.
      .onConflictDoNothing()
      .returning({ id: eventSignups.id });
  } catch (error) {
    console.error("event signup failed", error);
    return {
      status: "error",
      message: "Something went wrong on our end. Please try again.",
    };
  }

  if (inserted.length === 0) return { status: "already", email };

  return { status: "success", fullName, email };
}
