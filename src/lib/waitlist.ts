/**
 * Waitlist contract shared by the form and the route handler.
 *
 * Kept free of zod so the client form can import the limits without pulling
 * the validation library into its bundle. The server schema lives in
 * validation.ts and reads the same numbers.
 */

export const WAITLIST_MAX = {
  email: 254,
  fullName: 100,
  roleText: 100,
  building: 500,
  city: 100,
  school: 150,
  heardFrom: 300,
} as const;

export const PHONE_TYPES = ["iphone", "android", "other"] as const;

export const PHONE_LABELS: Record<(typeof PHONE_TYPES)[number], string> = {
  iphone: "iPhone",
  android: "Android",
  other: "Other / not sure",
};

/** Field labels, shared by the form, the admin table and the CSV export. */
export const WAITLIST_LABELS = {
  email: "Email",
  fullName: "Full name",
  roleText: "I am...",
  building: "What are you building?",
  city: "City",
  school: "School (high school or university)",
  heardFrom: "How'd you hear about us?",
  phoneType: "Phone",
  is17Plus: "I'm 17 or older",
  createdAt: "Joined",
} as const;

/** Submits faster than this after the form loaded are treated as bots. */
export const MIN_FILL_MS = 3000;

/** The pathname the top bar and the page itself live at. */
export const WAITLIST_PATH = "/waitlist";

export type WaitlistResponse =
  | { status: "success" }
  | { status: "already" }
  | { status: "rate_limited" }
  | { status: "invalid"; field: string }
  | { status: "error" };
