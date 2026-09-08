/**
 * Events whose signups are closed, by slug. The event page reads this to show
 * the at-capacity card instead of the form; the signup action reads it to
 * reject a post that never went through the page. Delete an entry to reopen
 * signups for that event.
 */
const CLOSED_REGISTRATIONS = new Set(["unbound-hackathon-2026"]);

export function isRegistrationOpen(slug: string) {
  return !CLOSED_REGISTRATIONS.has(slug);
}
