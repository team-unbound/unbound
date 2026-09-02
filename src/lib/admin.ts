/**
 * Admins are identified by email. Comparisons are case-insensitive, so store
 * these lowercase and always run addresses through `isAdminEmail`.
 */
const ADMIN_EMAILS = [
  "m.shahmeer.khan8@gmail.com",
  "muska2720@gmail.com",
  "rfarhin24@gmail.com",
] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(
    email.trim().toLowerCase() as (typeof ADMIN_EMAILS)[number],
  );
}
