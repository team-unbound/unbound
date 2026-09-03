import * as Sentry from "@sentry/node";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (!dsn) {
  console.error("FAIL: NEXT_PUBLIC_SENTRY_DSN is not set");
  process.exit(1);
}

Sentry.init({ dsn, tracesSampleRate: 0 });

const id = Sentry.captureException(
  new Error("Unbound setup verification — safe to ignore/resolve"),
);
console.log("event id:", id);

const delivered = await Sentry.flush(15000);
console.log(delivered ? "DELIVERED to Sentry" : "FAILED to deliver");
process.exit(delivered ? 0 : 1);
