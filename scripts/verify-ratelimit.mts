import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

console.log("PING:", await redis.ping());

const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  prefix: "unbound:selftest",
});

const id = `selftest-${Date.now()}`;
for (let i = 1; i <= 5; i++) {
  const { success, remaining } = await limiter.limit(id);
  console.log(`  attempt ${i}: success=${success} remaining=${remaining}`);
}
