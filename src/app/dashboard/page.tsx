import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { CancelButton } from "@/components/dashboard/cancel-button";
import { RespondButtons } from "@/components/dashboard/respond-buttons";
import { ProfileForm } from "@/components/profile/profile-form";
import { Section } from "@/components/ui/section";
import {
  getIncomingRequests,
  getOutgoingRequests,
  type IncomingRequest,
  type OutgoingRequest,
} from "@/db/community";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

function StatusPill({ status }: { status: string }) {
  return (
    <span className="rounded-full border border-line px-3 py-1 text-body-sm capitalize text-fg-muted">
      {status}
    </span>
  );
}

function EmailReveal({ email, label }: { email: string; label: string }) {
  return (
    <p className="mt-4 rounded-lg border border-line bg-surface px-4 py-3 text-body-sm">
      <span className="text-fg-subtle">{label} </span>
      <a
        href={`mailto:${email}`}
        className="text-fg underline underline-offset-4"
      >
        {email}
      </a>
    </p>
  );
}

function IncomingCard({ request }: { request: IncomingRequest }) {
  return (
    <li className="bg-canvas p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-h3 font-medium">{request.senderName}</h3>
          <p className="mt-1 text-body-sm text-fg-subtle">
            {[request.senderProfession, request.senderSchool]
              .filter(Boolean)
              .join(" · ") || "Member"}
          </p>
        </div>
        <StatusPill status={request.status} />
      </div>

      <blockquote className="mt-5 border-l border-line-strong pl-5 text-body-sm text-fg-muted text-pretty">
        {request.reason}
      </blockquote>

      {/* senderEmail is non-null only for accepted requests (enforced in SQL). */}
      {request.senderEmail ? (
        <EmailReveal email={request.senderEmail} label="Reach them at" />
      ) : null}

      {request.status === "pending" ? (
        <div className="mt-6">
          <RespondButtons requestId={request.id} />
        </div>
      ) : null}
    </li>
  );
}

function OutgoingCard({ request }: { request: OutgoingRequest }) {
  return (
    <li className="bg-canvas p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-h3 font-medium">{request.recipientName}</h3>
          <p className="mt-1 text-body-sm text-fg-subtle">
            {request.recipientProfession ?? "Member"}
          </p>
        </div>
        <StatusPill status={request.status} />
      </div>

      <blockquote className="mt-5 border-l border-line-strong pl-5 text-body-sm text-fg-muted text-pretty">
        {request.reason}
      </blockquote>

      {request.recipientEmail ? (
        <EmailReveal email={request.recipientEmail} label="Reach them at" />
      ) : null}

      {request.status === "declined" ? (
        <p className="mt-4 text-body-sm text-fg-subtle">
          They passed this time. You can send a new request later.
        </p>
      ) : null}

      {request.status === "pending" ? (
        <div className="mt-6">
          <CancelButton requestId={request.id} />
        </div>
      ) : null}
    </li>
  );
}

function Panel({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-h2 font-medium">{title}</h2>
        {typeof count === "number" ? (
          <span className="font-mono text-body-sm text-fg-subtle">
            {String(count).padStart(2, "0")}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center">
      <p className="text-body-sm text-fg-muted text-pretty">{children}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const profile = await requireProfile();

  const [incoming, outgoing] = await Promise.all([
    getIncomingRequests(profile.id),
    getOutgoingRequests(profile.id),
  ]);

  const pendingIncoming = incoming.filter((r) => r.status === "pending");
  const answeredIncoming = incoming.filter((r) => r.status !== "pending");
  const firstName = profile.fullName.split(" ")[0];

  return (
    <Section className="pt-40 lg:pt-48">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1 className="mt-8 text-h1 font-medium text-balance">
            {`${firstName}'s desk`}
          </h1>
          <p className="mt-6 max-w-xl text-body-lg text-fg-muted text-pretty">
            {profile.openToPairing
              ? "You're visible to other members and open to pairing requests."
              : "You're visible in the community, but not accepting pairing requests."}
          </p>
        </div>

        <Link
          href="/community"
          className="shrink-0 rounded-full border border-line-strong px-5 py-2 text-body-sm font-medium transition-colors hover:border-fg"
        >
          Browse community
        </Link>
      </div>

      <Panel title="Waiting on you" count={pendingIncoming.length}>
        {pendingIncoming.length > 0 ? (
          <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {pendingIncoming.map((request) => (
              <IncomingCard key={request.id} request={request} />
            ))}
          </ul>
        ) : (
          <Empty>
            No pairing requests right now. They will show up here with the
            sender&rsquo;s reason.
          </Empty>
        )}
      </Panel>

      {answeredIncoming.length > 0 ? (
        <Panel title="Already answered" count={answeredIncoming.length}>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {answeredIncoming.map((request) => (
              <IncomingCard key={request.id} request={request} />
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel title="Requests you sent" count={outgoing.length}>
        {outgoing.length > 0 ? (
          <ul className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {outgoing.map((request) => (
              <OutgoingCard key={request.id} request={request} />
            ))}
          </ul>
        ) : (
          <Empty>
            You have not asked anyone yet.{" "}
            <Link
              href="/community"
              className="text-fg underline underline-offset-4"
            >
              Find someone to build with
            </Link>
            .
          </Empty>
        )}
      </Panel>

      <Panel title="Your profile">
        <div className="mt-8 rounded-2xl border border-line bg-surface p-8 lg:p-10">
          <ProfileForm profile={profile} />
        </div>
      </Panel>
    </Section>
  );
}
