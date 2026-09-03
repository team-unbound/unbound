import { z } from "zod";

/** Shared input contracts. Every mutation parses through one of these. */

export const MAX_TAGS = 10;

/** "react, design ,React" -> ["react", "design"] */
const tagsField = z
  .string()
  .max(400)
  .optional()
  .transform((value) =>
    Array.from(
      new Set(
        (value ?? "")
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ),
  )
  .pipe(
    z
      .array(z.string().min(1).max(30, "Keep each tag under 30 characters."))
      .max(MAX_TAGS, `Pick at most ${MAX_TAGS} tags.`),
  );

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Tell us your name.")
    .max(120, "That name is too long."),
  gradeYear: optionalText(80),
  school: optionalText(160),
  bio: optionalText(600),
  funFacts: optionalText(400),
  profession: optionalText(160),
  tags: tagsField,
  openToPairing: z.boolean(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const pairingRequestSchema = z.object({
  /** Target profile. Always re-validated server-side against the DB. */
  recipientProfileId: z.uuid("That profile doesn't look right."),
  reason: z
    .string()
    .trim()
    .min(20, "Give them a real reason — at least 20 characters.")
    .max(600, "Keep it under 600 characters."),
});

export const pairingResponseSchema = z.object({
  requestId: z.uuid(),
  decision: z.enum(["accepted", "declined"]),
});

export const cancelPairingRequestSchema = z.object({
  requestId: z.uuid(),
});

/** Checkbox inputs arrive as "on" / absent. */
export function checkboxToBoolean(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

/** Collapses a ZodError into { field: firstMessage }. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}
