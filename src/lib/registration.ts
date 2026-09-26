/**
 * Events whose signups are closed, by slug, mapped to the cap they filled. The
 * event page reads this to show the at-capacity card instead of the form; the
 * signup action reads it to reject a post that never went through the page;
 * the events list files these under Previous even before they start. Delete an
 * entry to reopen signups for that event.
 */
const CLOSED_REGISTRATIONS = new Map([
  ["unbound-hackathon-2026", 50],
  ["unbound-x-ypls-club-2026", 500],
]);

/**
 * Events that never take signups at all — a showcase or a partner event we
 * only list. Distinct from CLOSED_REGISTRATIONS: "closed" says a door that was
 * open has shut, and the page says so by naming the cap. These never had a
 * door, so claiming they filled up would be a lie about a real event.
 */
const INFO_ONLY = new Set<string>();

/** False for both sets, so the signup action rejects either kind. */
export function isRegistrationOpen(slug: string) {
  return !CLOSED_REGISTRATIONS.has(slug) && !INFO_ONLY.has(slug);
}

export function isInfoOnly(slug: string) {
  return INFO_ONLY.has(slug);
}

export function isRegistrationClosed(slug: string) {
  return CLOSED_REGISTRATIONS.has(slug);
}

/** The cap a closed event filled, or undefined if it isn't closed. */
export function capacityOf(slug: string) {
  return CLOSED_REGISTRATIONS.get(slug);
}
