import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Section } from "@/components/ui/section";
import { getAdminTables } from "@/db/admin";
import { requireAdmin } from "@/lib/auth";
import { formatEventDate } from "@/lib/format";
import { PHONE_LABELS, WAITLIST_LABELS } from "@/lib/waitlist";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Always read live data; never cache an admin view.
export const dynamic = "force-dynamic";

function Table({
  title,
  count,
  headers,
  action,
  children,
}: {
  title: string;
  count: number;
  headers: string[];
  /** Rendered beside the count, e.g. an export link. */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-h2 font-medium">{title}</h2>
        <div className="flex items-center gap-4">
          <span className="font-mono text-body-sm text-fg-subtle">
            {String(count).padStart(3, "0")}
          </span>
          {action}
        </div>
      </div>

      {count > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[52rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-surface">
                {headers.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="whitespace-nowrap px-5 py-4 text-label uppercase tracking-[0.18em] text-fg-subtle"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">{children}</tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-body-sm text-fg-muted">Nothing here yet.</p>
        </div>
      )}
    </section>
  );
}

const cell = "px-5 py-4 align-top text-body-sm text-fg-muted";

function Yes({ value }: { value: boolean }) {
  return <span className={value ? "text-fg" : "text-fg-subtle"}>{value ? "Yes" : "No"}</span>;
}

export default async function AdminPage() {
  // Gated twice on purpose: here, and inside getAdminTables.
  await requireAdmin();
  const { members, subscribers, events, requests, waitlist, waitlistTotal } =
    await getAdminTables();

  return (
    <Section className="pt-40 lg:pt-48">
      <span className="eyebrow">Admin</span>
      <h1 className="mt-8 text-h1 font-medium text-balance">Everything, at once.</h1>
      <p className="mt-6 max-w-xl text-body-lg text-fg-muted text-pretty">
        Live data from Postgres. Showing the 200 most recent rows per table.
      </p>

      <Table
        title="Members"
        count={members.length}
        headers={["Name", "Email", "School", "Year", "Building", "Pairing", "Onboarded"]}
      >
        {members.map((member) => (
          <tr key={member.id}>
            <td className={`${cell} text-fg`}>{member.fullName}</td>
            <td className={cell}>{member.email}</td>
            <td className={cell}>{member.school ?? "—"}</td>
            <td className={cell}>{member.gradeYear ?? "—"}</td>
            <td className={cell}>{member.profession ?? "—"}</td>
            <td className={cell}>
              <Yes value={member.openToPairing} />
            </td>
            <td className={cell}>
              {member.onboardedAt ? formatEventDate(member.onboardedAt) : "Incomplete"}
            </td>
          </tr>
        ))}
      </Table>

      <Table
        title="Newsletter subscribers"
        count={subscribers.length}
        headers={["Email", "First name", "Last name", "Subscribed"]}
      >
        {subscribers.map((subscriber) => (
          <tr key={subscriber.id}>
            <td className={`${cell} text-fg`}>{subscriber.email}</td>
            <td className={cell}>{subscriber.firstName ?? "—"}</td>
            <td className={cell}>{subscriber.lastName ?? "—"}</td>
            <td className={cell}>{formatEventDate(subscriber.createdAt)}</td>
          </tr>
        ))}
      </Table>

      <Table
        title="Events"
        count={events.length}
        headers={["Title", "Slug", "Location", "Starts", "Published"]}
      >
        {events.map((event) => (
          <tr key={event.id}>
            <td className={`${cell} text-fg`}>{event.title}</td>
            <td className={`${cell} font-mono`}>{event.slug}</td>
            <td className={cell}>{event.location ?? "—"}</td>
            <td className={cell}>{formatEventDate(event.startsAt)}</td>
            <td className={cell}>
              <Yes value={event.isPublished} />
            </td>
          </tr>
        ))}
      </Table>

      <Table
        title="Pairing requests"
        count={requests.length}
        headers={["From", "To", "Status", "Reason", "Sent", "Answered"]}
      >
        {requests.map((request) => (
          <tr key={request.id}>
            <td className={`${cell} text-fg`}>{request.senderName}</td>
            <td className={`${cell} text-fg`}>{request.recipientName}</td>
            <td className={`${cell} capitalize`}>{request.status}</td>
            <td className={`${cell} max-w-md`}>{request.reason}</td>
            <td className={cell}>{formatEventDate(request.createdAt)}</td>
            <td className={cell}>
              {request.respondedAt ? formatEventDate(request.respondedAt) : "—"}
            </td>
          </tr>
        ))}
      </Table>

      <Table
        title="Waitlist"
        count={waitlistTotal}
        headers={[
          WAITLIST_LABELS.email,
          WAITLIST_LABELS.fullName,
          WAITLIST_LABELS.roleText,
          WAITLIST_LABELS.building,
          WAITLIST_LABELS.city,
          WAITLIST_LABELS.school,
          WAITLIST_LABELS.heardFrom,
          WAITLIST_LABELS.phoneType,
          WAITLIST_LABELS.is17Plus,
          WAITLIST_LABELS.createdAt,
        ]}
        action={
          // A plain link, not next/link: it downloads a file, not a page.
          <a
            href="/admin/waitlist/export"
            download
            className="rounded-full border border-line-strong px-5 py-2 text-body-sm font-medium transition-colors hover:border-fg"
          >
            Export CSV
          </a>
        }
      >
        {waitlist.map((signup) => (
          <tr key={signup.id}>
            <td className={`${cell} text-fg`}>{signup.email}</td>
            <td className={`${cell} text-fg`}>{signup.fullName}</td>
            <td className={cell}>{signup.roleText ?? "—"}</td>
            <td className={`${cell} max-w-md`}>{signup.building ?? "—"}</td>
            <td className={cell}>{signup.city ?? "—"}</td>
            <td className={cell}>{signup.school ?? "—"}</td>
            <td className={`${cell} max-w-md`}>{signup.heardFrom ?? "—"}</td>
            <td className={cell}>
              {signup.phoneType ? PHONE_LABELS[signup.phoneType] : "—"}
            </td>
            <td className={cell}>
              <Yes value={signup.is17Plus} />
            </td>
            <td className={cell}>{formatEventDate(signup.createdAt)}</td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}
