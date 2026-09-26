/**
 * Read-only-by-rollback security probe.
 *
 * Everything happens inside a transaction that is ALWAYS rolled back, so no
 * test rows are ever committed to the database.
 */
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const c = await pool.connect();

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}

try {
  await c.query("BEGIN");

  const mk = async (tag: string) => {
    const r = await c.query(
      `INSERT INTO profiles (clerk_user_id, email, full_name, onboarded_at)
       VALUES ($1,$2,$3, now()) RETURNING id`,
      [`probe_${tag}_${Date.now()}`, `${tag}@probe.invalid`, `Probe ${tag}`],
    );
    return r.rows[0].id as string;
  };

  const A = await mk("alice");
  const B = await mk("bob");
  const C = await mk("carol");

  const req = await c.query(
    `INSERT INTO pairing_requests (sender_id, recipient_id, reason)
     VALUES ($1,$2,$3) RETURNING id`,
    [A, B, "Probe reason long enough to pass validation."],
  );
  const reqId = req.rows[0].id as string;

  // The exact WHERE clause used by respondToPairingRequest.
  const respond = (requestId: string, responderId: string) =>
    c.query(
      `UPDATE pairing_requests SET status='accepted', responded_at=now()
       WHERE id=$1 AND recipient_id=$2 AND status='pending' RETURNING id`,
      [requestId, responderId],
    );

  console.log("\nIDOR — responding to a request that isn't yours");
  check("unrelated user (Carol) cannot accept", (await respond(reqId, C)).rowCount === 0);
  check("sender (Alice) cannot accept her own", (await respond(reqId, A)).rowCount === 0);
  check("recipient (Bob) CAN accept", (await respond(reqId, B)).rowCount === 1);
  check("accepting twice is a no-op", (await respond(reqId, B)).rowCount === 0);

  console.log("\nSelf-pairing constraint");
  let selfBlocked = false;
  try {
    await c.query("SAVEPOINT sp");
    await c.query(
      `INSERT INTO pairing_requests (sender_id, recipient_id, reason) VALUES ($1,$1,$2)`,
      [A, "trying to pair with myself"],
    );
    await c.query("RELEASE SAVEPOINT sp");
  } catch {
    selfBlocked = true;
    await c.query("ROLLBACK TO SAVEPOINT sp");
  }
  check("self-request rejected by CHECK constraint", selfBlocked);

  console.log("\nDuplicate pending requests");
  const dup = await c.query(
    `INSERT INTO pairing_requests (sender_id, recipient_id, reason)
     VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id`,
    [A, C, "first request to carol, long enough"],
  );
  check("first pending request inserts", dup.rowCount === 1);
  const dup2 = await c.query(
    `INSERT INTO pairing_requests (sender_id, recipient_id, reason)
     VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id`,
    [A, C, "second request to carol, long enough"],
  );
  check("duplicate pending request blocked", dup2.rowCount === 0);

  console.log("\nEmail reveal — CASE gate on status");
  const revealed = await c.query(
    `SELECT case when pr.status='accepted' then s.email else null end AS sender_email
     FROM pairing_requests pr JOIN profiles s ON s.id=pr.sender_id
     WHERE pr.recipient_id=$1`,
    [B],
  );
  check("accepted request reveals sender email", revealed.rows[0].sender_email === "alice@probe.invalid");

  const pendingReveal = await c.query(
    `SELECT case when pr.status='accepted' then r.email else null end AS recipient_email
     FROM pairing_requests pr JOIN profiles r ON r.id=pr.recipient_id
     WHERE pr.sender_id=$1 AND pr.recipient_id=$2`,
    [A, C],
  );
  check("pending request hides email", pendingReveal.rows[0].recipient_email === null);

  await c.query(
    `UPDATE pairing_requests SET status='declined', responded_at=now()
     WHERE sender_id=$1 AND recipient_id=$2`, [A, C]);
  const declinedReveal = await c.query(
    `SELECT case when pr.status='accepted' then r.email else null end AS recipient_email
     FROM pairing_requests pr JOIN profiles r ON r.id=pr.recipient_id
     WHERE pr.sender_id=$1 AND pr.recipient_id=$2`,
    [A, C],
  );
  check("declined request hides email", declinedReveal.rows[0].recipient_email === null);

  console.log("\nCancel — sender-side ownership");
  const cancelReq = await c.query(
    `INSERT INTO pairing_requests (sender_id, recipient_id, reason)
     VALUES ($1,$2,$3) RETURNING id`,
    [A, B, "Second probe request, unique because prior one is accepted."],
  );
  const cancelReqId = cancelReq.rows[0].id as string;
  const cancel = (requestId: string, actingSenderId: string) =>
    c.query(
      `DELETE FROM pairing_requests
       WHERE id=$1 AND sender_id=$2 AND status='pending' RETURNING id`,
      [requestId, actingSenderId],
    );
  check("recipient (Bob) cannot cancel Alice's request", (await cancel(cancelReqId, B)).rowCount === 0);
  check("unrelated user (Carol) cannot cancel", (await cancel(cancelReqId, C)).rowCount === 0);
  check("sender (Alice) CAN cancel her own", (await cancel(cancelReqId, A)).rowCount === 1);
  check("cancelling twice is a no-op", (await cancel(cancelReqId, A)).rowCount === 0);

  console.log("\nNewsletter duplicate handling");
  // Mirrors subscribeToNewsletter: the action reads .returning() to tell a
  // fresh signup from an address that is already on the list.
  const firstSignup = await c.query(
    `INSERT INTO newsletter_subscribers (email, first_name)
     VALUES ('Probe@Example.invalid', 'Real Owner')
     ON CONFLICT DO NOTHING RETURNING id`);
  check("first signup returns a row", firstSignup.rowCount === 1);

  const dupEmail = await c.query(
    `INSERT INTO newsletter_subscribers (email) VALUES ('probe@example.invalid')
     ON CONFLICT DO NOTHING RETURNING id`);
  check("case-insensitive duplicate email blocked", dupEmail.rowCount === 0);

  const dupSpaced = await c.query(
    `INSERT INTO newsletter_subscribers (email) VALUES ('PROBE@EXAMPLE.INVALID')
     ON CONFLICT DO NOTHING RETURNING id`);
  check("all-caps duplicate blocked too", dupSpaced.rowCount === 0);

  const rows = await c.query(
    `SELECT count(*)::int AS n FROM newsletter_subscribers
     WHERE lower(email)='probe@example.invalid'`);
  check("only one row exists for the address", rows.rows[0].n === 1);

  // A resubscribe must not be able to rewrite the name the real owner gave us.
  const owner = await c.query(
    `SELECT first_name FROM newsletter_subscribers
     WHERE lower(email)='probe@example.invalid'`);
  check("duplicate signup cannot overwrite the stored name", owner.rows[0].first_name === "Real Owner");

  // Two people behind one school NAT must both be able to sign up.
  const other = await c.query(
    `INSERT INTO newsletter_subscribers (email) VALUES ('someone.else@probe.invalid')
     ON CONFLICT DO NOTHING RETURNING id`);
  check("a different address on the same network still inserts", other.rowCount === 1);

} finally {
  await c.query("ROLLBACK");
  c.release();
  await pool.end();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
