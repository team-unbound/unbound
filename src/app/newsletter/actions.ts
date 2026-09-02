"use server";

import { z } from "zod";
import { getDb, isDatabaseConfigured } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

const subscribeSchema = z.object({
  email: z.email("Enter a valid email address.").max(320),
  firstName: z.string().trim().max(120).optional(),
  lastName: z.string().trim().max(120).optional(),
});

export type SubscribeState =
  | { status: "idle" }
  | { status: "success"; email: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export async function subscribeToNewsletter(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
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
      message: "Signups aren't live yet — the database isn't connected.",
    };
  }

  const { email, firstName, lastName } = parsed.data;

  try {
    await getDb()
      .insert(newsletterSubscribers)
      .values({ email, firstName, lastName })
      // Re-submitting an existing address is a no-op, not an error.
      .onConflictDoNothing();
  } catch (error) {
    console.error("newsletter subscribe failed", error);
    return {
      status: "error",
      message: "Something went wrong on our end. Please try again.",
    };
  }

  return { status: "success", email };
}
