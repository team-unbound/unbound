import { getAllWaitlistSignups } from "@/db/admin";
import { requireAdmin } from "@/lib/auth";
import { PHONE_LABELS, WAITLIST_LABELS as LABELS } from "@/lib/waitlist";

// No ".csv" on this path on purpose: the proxy matcher skips paths ending in
// it as static files, which would take this route out from under Clerk.

// Always read live data; never cache an admin export.
export const dynamic = "force-dynamic";

/**
 * One CSV cell. Quoted throughout, and a leading formula character is
 * neutralised: these values are typed by anonymous visitors, and a cell that
 * starts with "=" runs as a formula when the file is opened in a spreadsheet.
 */
function cell(value: string | null | undefined): string {
  let text = value ?? "";
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  // Gated twice on purpose, like the admin page: here, and inside the query.
  await requireAdmin();
  const rows = await getAllWaitlistSignups();

  const header = [
    LABELS.email,
    LABELS.fullName,
    LABELS.roleText,
    LABELS.building,
    LABELS.city,
    LABELS.school,
    LABELS.heardFrom,
    LABELS.phoneType,
    LABELS.is17Plus,
    LABELS.createdAt,
  ];

  const lines = [
    header.map(cell).join(","),
    ...rows.map((row) =>
      [
        row.email,
        row.fullName,
        row.roleText,
        row.building,
        row.city,
        row.school,
        row.heardFrom,
        row.phoneType ? PHONE_LABELS[row.phoneType] : "",
        row.is17Plus ? "Yes" : "No",
        row.createdAt.toISOString(),
      ]
        .map(cell)
        .join(","),
    ),
  ];

  const date = new Date().toISOString().slice(0, 10);

  // Leading BOM so Excel reads the file as UTF-8 instead of mangling accents.
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="waitlist-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
