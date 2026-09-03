"use server";

import { z } from "zod";
import { getDb, isDatabaseConfigured } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { checkRateLimit, getClientIp, retryAfterLabel } from "@/lib/rate-limit";

const subscribeSchema = z.object({
  email: z.email("Enter a valid email address.").max(320),
  firstName: z.string().trim().max(120).optional(),
  lastName: z.string().trim().max(120).optional(),
});

export type SubscribeState =
  | { status: "idle" }
  | { status: "success"; email: string }
  | { status: "already"; email: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export async function subscribeToNewsletter(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  // Anonymous endpoint, so the only key available is the caller's IP.
  const ip = await getClientIp();
  const limit = await checkRateLimit("newsletter", ip);
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many signups from this connection. Try again ${retryAfterLabel(limit.retryAfter)}.`,
    };
  }

  const parsed = subscribeSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    firstName: String(formData.get("firstName") ?? "").trim() || undefined,
    lastName: String(formData.get("lastName") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  if (!isDatabaseConfigured) {
    return {
      status: "error",
      message: "Signups aren't live yet. The database isn't connected.",
    };
  }

  const { email, firstName, lastName } = parsed.data;

  let inserted: { id: string }[];
  try {
    inserted = await getDb()
      .insert(newsletterSubscribers)
      .values({ email, firstName, lastName })
      // Conflicts on the lower(email) unique index, so Foo@x.com and
      // foo@x.com are the same subscriber. Deliberately not an update: a
      // second signup on a known address must not be able to overwrite the
      // name the real owner gave us.
      .onConflictDoNothing()
      .returning({ id: newsletterSubscribers.id });
  } catch (error) {
    console.error("newsletter subscribe failed", error);
    return {
      status: "error",
      message: "Something went wrong on our end. Please try again.",
    };
  }

  // No row back means the address was already on the list.
  if (inserted.length === 0) return { status: "already", email };

  return { status: "success", email };
}
