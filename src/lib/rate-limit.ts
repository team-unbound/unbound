import "server-only";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/nextjs";

/**
 * Upstash-backed rate limiting.
 *
 * Availability tradeoff: if Redis is unreachable we ALLOW the request and
 * report to Sentry, rather than taking the site down when Upstash has an
 * outage.
 *
 * Missing configuration is different from an outage: it means the limits never
 * existed at all, on every anonymous endpoint, for as long as the deploy has
 * been up. It still allows the request — a missing env var should not take
 * signups down — but in production it reports to Sentry rather than writing a
 * console warning nobody reads. UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are what turn this on; see .env.example.
 */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const isRateLimitConfigured = Boolean(url && token);

const redis = isRateLimitConfigured
  ? new Redis({ url: url!, token: token! })
  : null;

function make(tokens: number, window: Parameters<typeof Ratelimit.slidingWindow>[1], prefix: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
    prefix: `unbound:${prefix}`,
  });
}

/** Anonymous, IP-keyed: newsletter signup. */
const newsletterLimiter = make(5, "10 m", "newsletter");
/** Anonymous, IP-keyed: event signup. */
const eventSignupLimiter = make(5, "10 m", "event-signup");
/** Per-user: sending pairing requests. */
const pairingLimiter = make(10, "1 h", "pairing");
/** Per-user: responding to pairing requests (accept/decline). */
const pairingRespondLimiter = make(60, "1 h", "pairing-respond");
/** Per-user: onboarding + profile writes. */
const profileLimiter = make(20, "1 h", "profile");

const limiters = {
  newsletter: newsletterLimiter,
  eventSignup: eventSignupLimiter,
  pairing: pairingLimiter,
  pairingRespond: pairingRespondLimiter,
  profile: profileLimiter,
} as const;

export type LimiterName = keyof typeof limiters;

export type RateLimitResult = {
  success: boolean;
  /** Seconds until the caller may retry. */
  retryAfter: number;
};

/**
 * Best-effort client IP. Behind Vercel this is the left-most `x-forwarded-for`
 * entry. Not spoof-proof on its own, which is why user-scoped limits key on the
 * Clerk user id instead wherever a signed-in user exists.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Reported limiter names, so an unconfigured deploy raises one Sentry issue per
 * limiter rather than one per request.
 */
const reportedUnconfigured = new Set<LimiterName>();

function reportUnconfigured(name: LimiterName) {
  console.warn(
    `[rate-limit] Upstash not configured — "${name}" is not being limited.`,
  );

  if (process.env.NODE_ENV !== "production") return;
  if (reportedUnconfigured.has(name)) return;
  reportedUnconfigured.add(name);

  Sentry.captureMessage(
    `Rate limiting is disabled in production: "${name}" has no Upstash configuration.`,
    { level: "error", tags: { limiter: name } },
  );
}

export async function checkRateLimit(
  name: LimiterName,
  identifier: string,
): Promise<RateLimitResult> {
  const limiter = limiters[name];

  if (!limiter) {
    reportUnconfigured(name);
    return { success: true, retryAfter: 0 };
  }

  try {
    const { success, reset } = await limiter.limit(identifier);
    return {
      success,
      retryAfter: Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch (error) {
    // Fail open: an Upstash outage shouldn't break signups.
    Sentry.captureException(error, { tags: { limiter: name } });
    return { success: true, retryAfter: 0 };
  }
}

/** Human-readable "try again in ..." fragment. */
export function retryAfterLabel(seconds: number): string {
  if (seconds <= 60) return "in a minute";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `in ${minutes} minutes`;
  const hours = Math.ceil(minutes / 60);
  return `in ${hours} hour${hours === 1 ? "" : "s"}`;
}
