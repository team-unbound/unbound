import { siteConfig } from "./site";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: siteConfig.timeZone,
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
  timeZone: siteConfig.timeZone,
});

/** e.g. "Tue, 12 May 2026" */
export function formatEventDate(date: Date) {
  return dateFormatter.format(date);
}

/** e.g. "18:30 UTC" */
export function formatEventTime(date: Date) {
  return timeFormatter.format(date);
}

/** Machine-readable value for <time dateTime>. */
export function toDateTimeAttr(date: Date) {
  return date.toISOString();
}
