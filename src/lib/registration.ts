/**
 * Events whose signups are closed, by slug. The event page reads this to show
 * the at-capacity card instead of the form; the signup action reads it to
 * reject a post that never went through the page. Delete an entry to reopen
 * signups for that event.
 */
const CLOSED_REGISTRATIONS = new Set(["unbound-hackathon-2026"]);

/**
 * Events that never take signups at all — a showcase or a partner event we
 * only list. Distinct from CLOSED_REGISTRATIONS: "closed" says a door that was
 * open has shut, and the page says so by naming the cap. These never had a
 * door, so claiming they filled up would be a lie about a real event.
 */
const INFO_ONLY = new Set(["unbound-x-ypls-club-2026"]);

/** False for both sets, so the signup action rejects either kind. */
export function isRegistrationOpen(slug: string) {
  return !CLOSED_REGISTRATIONS.has(slug) && !INFO_ONLY.has(slug);
}

export function isInfoOnly(slug: string) {
  return INFO_ONLY.has(slug);
}
