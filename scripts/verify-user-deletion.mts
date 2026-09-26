/**
 * End-to-end check for the `user.deleted` webhook.
 *
 * Unlike security-probe.mts this one COMMITS its rows, because the point is to
 * prove the real HTTP endpoint deletes real data. Everything it creates is
 * prefixed `wh_del_probe_` and is removed again in the finally block, whether
 * the run passes, fails, or throws.
 *
 * Usage:
 *   1. Build, then start the server with a known signing secret:
 *        CLERK_WEBHOOK_SIGNING_SECRET=whsec_... npx next start -p 3125
 *   2. Run with the same secret and PROBE_BASE_URL pointed at it.
 */
import { createHmac } from "node:crypto";
import { Pool } from "@neondatabase/serverless";

const BASE = process.env.PROBE_BASE_URL ?? "http://localhost:3125";
const SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
const TAG = "wh_del_probe_";

if (!SECRET?.startsWith("whsec_")) {
  console.error("CLERK_WEBHOOK_SIGNING_SECRET must be set to a whsec_ value.");
  process.exit(1);
}

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

/** Signs a body the way Svix does, so verifyWebhook accepts it. */
function post(body: unknown, { corrupt = false } = {}) {
  const payload = JSON.stringify(body);
  const id = `msg_${Date.now()}`;
  const ts = Math.floor(Date.now() / 1000).toString();
  const key = Buffer.from(SECRET!.slice("whsec_".length), "base64");
  const signature = createHmac("sha256", key)
    .update(`${id}.${ts}.${payload}`)
    .digest("base64");

  return fetch(`${BASE}/api/webhooks/clerk`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": id,
      "svix-timestamp": ts,
      "svix-signature": `v1,${corrupt ? "AAAAdeliberatelywrongsignature" : signature}`,
    },
    body: payload,
  });
}

const deletedEvent = (clerkUserId: string) => ({
  type: "user.deleted",
  object: "event",
  data: { id: clerkUserId, object: "user", deleted: true },
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const c = await pool.connect();

async function snapshot(label: string, ids: string[]) {
  const profileRows = await c.query(
    `SELECT clerk_user_id, full_name, email FROM profiles
     WHERE clerk_user_id = ANY($1::text[]) ORDER BY clerk_user_id`,
    [ids],
  );
  const requestRows = await c.query(
    `SELECT s.clerk_user_id AS sender, r.clerk_user_id AS recipient, pr.status
     FROM pairing_requests pr
     JOIN profiles s ON s.id = pr.sender_id
     JOIN profiles r ON r.id = pr.recipient_id
     WHERE s.clerk_user_id = ANY($1::text[]) OR r.clerk_user_id = ANY($1::text[])
     ORDER BY sender, recipient`,
    [ids],
  );

  console.log(`\n  --- ${label} ---`);
  console.log(`  profiles (${profileRows.rowCount}):`);
  for (const r of profileRows.rows) {
    console.log(`    ${r.clerk_user_id}  ${r.full_name}  ${r.email}`);
  }
  console.log(`  pairing_requests (${requestRows.rowCount}):`);
  for (const r of requestRows.rows) {
    console.log(`    ${r.sender} -> ${r.recipient}  [${r.status}]`);
  }
  return { profiles: profileRows.rowCount!, requests: requestRows.rowCount! };
}

const stamp = Date.now();
const alice = `${TAG}alice_${stamp}`;
const bob = `${TAG}bob_${stamp}`;
const carol = `${TAG}carol_${stamp}`;
const ids = [alice, bob, carol];

try {
  const mk = async (clerkUserId: string, name: string) => {
    const r = await c.query(
      `INSERT INTO profiles (clerk_user_id, email, full_name, onboarded_at)
       VALUES ($1, $2, $3, now()) RETURNING id`,
      [clerkUserId, `${name.toLowerCase()}.${stamp}@probe.invalid`, name],
    );
    return r.rows[0].id as string;
  };

  const aliceId = await mk(alice, "Probe Alice");
  const bobId = await mk(bob, "Probe Bob");
  const carolId = await mk(carol, "Probe Carol");

  // Alice is on BOTH sides of a request, which is the case that matters:
  // one sent by her, one sent to her. Both must go.
  await c.query(
    `INSERT INTO pairing_requests (sender_id, recipient_id, reason, status)
     VALUES ($1, $2, $3, 'accepted')`,
    [aliceId, bobId, "Alice asked Bob, long enough to pass validation."],
  );
  await c.query(
    `INSERT INTO pairing_requests (sender_id, recipient_id, reason)
     VALUES ($1, $2, $3)`,
    [carolId, aliceId, "Carol asked Alice, long enough to pass validation."],
  );
  // Untouched control: nothing to do with Alice.
  await c.query(
    `INSERT INTO pairing_requests (sender_id, recipient_id, reason)
     VALUES ($1, $2, $3)`,
    [bobId, carolId, "Bob asked Carol, long enough to pass validation."],
  );

  const before = await snapshot("BEFORE deletion", ids);
  check("3 profiles seeded", before.profiles === 3);
  check("3 pairing requests seeded", before.requests === 3);

  console.log("\n  Signature verification");
  const bad = await post(deletedEvent(alice), { corrupt: true });
  check("forged signature rejected with 400", bad.status === 400, `got ${bad.status}`);

  const stillThere = await c.query(
    `SELECT count(*)::int AS n FROM profiles WHERE clerk_user_id = $1`,
    [alice],
  );
  check("forged request deleted nothing", stillThere.rows[0].n === 1);

  console.log("\n  Deleting Alice via the real endpoint");
  const res = await post(deletedEvent(alice));
  const body = await res.json();
  console.log(`  response ${res.status} ${JSON.stringify(body)}`);
  check("webhook returned 200", res.status === 200, `got ${res.status}`);
  check("reported 1 profile deleted", body.deletedProfiles === 1);
  check("reported 2 pairing requests deleted", body.deletedPairingRequests === 2);

  const after = await snapshot("AFTER deletion", ids);
  check("Alice's profile row is gone", after.profiles === 2);
  check(
    "both of Alice's pairing requests are gone (sent AND received)",
    after.requests === 1,
  );

  const aliceGone = await c.query(
    `SELECT count(*)::int AS n FROM profiles WHERE clerk_user_id = $1`,
    [alice],
  );
  check("no profile row for Alice by any lookup", aliceGone.rows[0].n === 0);

  const orphans = await c.query(
    `SELECT count(*)::int AS n FROM pairing_requests
     WHERE sender_id = $1 OR recipient_id = $1`,
    [aliceId],
  );
  check("no pairing_requests reference her profile id", orphans.rows[0].n === 0);

  const survivors = await c.query(
    `SELECT count(*)::int AS n FROM profiles WHERE clerk_user_id = ANY($1::text[])`,
    [[bob, carol]],
  );
  check("Bob and Carol untouched", survivors.rows[0].n === 2);

  console.log("\n  Redelivery and unknown users");
  const again = await post(deletedEvent(alice));
  const againBody = await again.json();
  check("redelivering the same event is a safe no-op", again.status === 200 && againBody.skipped === "no-profile");

  const unknown = await post(deletedEvent(`${TAG}never_existed_${stamp}`));
  check("deleting a user with no profile is a no-op", unknown.status === 200);
} finally {
  // Committed rows, so clean them up by hand.
  await c.query(`DELETE FROM profiles WHERE clerk_user_id LIKE $1`, [`${TAG}%`]);
  c.release();
  await pool.end();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
