import { getDb, isDatabaseConfigured } from "@/db";
import { waitlistSignups } from "@/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { fieldErrorsFrom, waitlistSchema } from "@/lib/validation";
import { MIN_FILL_MS, WAITLIST_MAX, type WaitlistResponse } from "@/lib/waitlist";

/**
 * App waitlist signup. Anonymous, so nothing the client sent is trusted beyond
 * what the checks below establish. They run cheapest first, and nothing here
 * is keyed on IP or device: at an event, many real people share one address.
 */

function respond(body: WaitlistResponse, status = 200) {
  return Response.json(body, { status });
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object") throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return respond({ status: "error" }, 400);
  }

  // a) Honeypot. Real users never see the field; a bot that filled it gets
  // the same answer a real signup does, so it has nothing to adapt to.
  if (str(body.website) !== "") {
    return respond({ status: "success" });
  }

  // b) Minimum fill time. Both moments come from the browser's own clock, so
  // a visitor whose clock disagrees with ours isn't locked out.
  const loadedAt = Number(body.loadedAt);
  const sentAt = Number(body.sentAt);
  if (
    !Number.isFinite(loadedAt) ||
    !Number.isFinite(sentAt) ||
    sentAt - loadedAt < MIN_FILL_MS
  ) {
    return respond({ status: "rate_limited" }, 429);
  }

  // c) Whole-form limit.
  const global = await checkRateLimit("waitlistGlobal", "all");
  if (!global.success) {
    return respond({ status: "rate_limited" }, 429);
  }

  // d) Per-email limit. Lowercased for the key only — the stored address
  // keeps its case. Capped so an oversized value can't become an oversized
  // Redis key; anything longer fails validation below anyway.
  const email = str(body.email).trim();
  const emailKey = email.toLowerCase().slice(0, WAITLIST_MAX.email + 1);
  const perEmail = await checkRateLimit("waitlistEmail", emailKey);
  if (!perEmail.success) {
    return respond({ status: "rate_limited" }, 429);
  }

  // e) Validate.
  const parsed = waitlistSchema.safeParse({
    email,
    fullName: str(body.fullName),
    roleText: str(body.roleText),
    building: str(body.building),
    city: str(body.city),
    school: str(body.school),
    heardFrom: str(body.heardFrom),
    phoneType: str(body.phoneType) || undefined,
    is17Plus: body.is17Plus === true,
  });

  if (!parsed.success) {
    const field = Object.keys(fieldErrorsFrom(parsed.error))[0] ?? "form";
    return respond({ status: "invalid", field }, 400);
  }

  if (!isDatabaseConfigured) {
    return respond({ status: "error" }, 503);
  }

  // f) Insert. The unique constraint on email is what makes this race-safe:
  // two simultaneous submits can't both land, and a repeat never overwrites
  // the first row.
  try {
    const inserted = await getDb()
      .insert(waitlistSignups)
      .values(parsed.data)
      .onConflictDoNothing({ target: waitlistSignups.email })
      .returning({ id: waitlistSignups.id });

    return respond({ status: inserted.length > 0 ? "success" : "already" });
  } catch (error) {
    console.error("waitlist signup failed", error);
    return respond({ status: "error" }, 500);
  }
}
