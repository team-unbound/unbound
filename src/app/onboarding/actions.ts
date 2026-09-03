"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { getVerifiedPrimaryEmail, requireUserId } from "@/lib/auth";
import { checkRateLimit, retryAfterLabel } from "@/lib/rate-limit";
import {
  checkboxToBoolean,
  fieldErrorsFrom,
  profileSchema,
} from "@/lib/validation";

/**
 * Only same-origin, single-slash paths are accepted, so a crafted form can't
 * turn a successful save into an open redirect to another site.
 */
function safeRedirectPath(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export type ProfileFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

/**
 * Creates or updates the signed-in user's own profile.
 *
 * The row is always keyed on the Clerk user id from the session, so a caller
 * cannot write to somebody else's profile no matter what they post. Email is
 * taken from Clerk, never from the form.
 */
export async function saveProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await requireUserId();

  const limit = await checkRateLimit("profile", userId);
  if (!limit.success) {
    return {
      status: "error",
      message: `Too many updates. Try again ${retryAfterLabel(limit.retryAfter)}.`,
    };
  }

  const parsed = profileSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    gradeYear: String(formData.get("gradeYear") ?? ""),
    school: String(formData.get("school") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    funFacts: String(formData.get("funFacts") ?? ""),
    profession: String(formData.get("profession") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    openToPairing: checkboxToBoolean(formData.get("openToPairing")),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const email = await getVerifiedPrimaryEmail();
  if (!email) {
    return {
      status: "error",
      message:
        "Your email address isn't verified yet. Verify it with Clerk, then try again.",
    };
  }

  const values = parsed.data;
  const now = new Date();

  try {
    await getDb()
      .insert(profiles)
      .values({
        clerkUserId: userId,
        email,
        ...values,
        onboardedAt: now,
        updatedAt: now,
      })
      // Second save is an edit of the same row, not a new profile.
      .onConflictDoUpdate({
        target: profiles.clerkUserId,
        set: { ...values, email, updatedAt: now },
      });
  } catch (error) {
    console.error("saveProfile failed", error);
    return {
      status: "error",
      message: "Couldn't save your profile. Please try again.",
    };
  }

  revalidatePath("/community");
  revalidatePath("/dashboard");

  const target = safeRedirectPath(formData.get("redirectTo"));
  if (target) redirect(target);

  return { status: "success" };
}

/** Toggle "open to pairing" from the dashboard without a full form submit. */
export async function setOpenToPairing(open: boolean): Promise<void> {
  const userId = await requireUserId();

  const limit = await checkRateLimit("profile", userId);
  if (!limit.success) return;

  await getDb()
    .update(profiles)
    .set({ openToPairing: open, updatedAt: new Date() })
    .where(eq(profiles.clerkUserId, userId));

  revalidatePath("/community");
  revalidatePath("/dashboard");
}
