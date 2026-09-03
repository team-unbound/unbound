"use client";

import { useState } from "react";
import type { CommunityProfile } from "@/db/community";
import { PairingRequestForm } from "./pairing-request-form";

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Status line shown instead of the request button, per relationship. */
const relationLabel: Record<string, string> = {
  self: "This is you",
  "outgoing-pending": "Request sent — waiting on them",
  "incoming-pending": "They asked to pair with you",
  accepted: "You're paired",
  declined: "Request declined",
};

export function ProfileCard({ profile }: { profile: CommunityProfile }) {
  const [open, setOpen] = useState(false);

  const canRequest =
    profile.relation === "none" || profile.relation === "declined";
  const showPairing = profile.openToPairing && canRequest;

  return (
    <article className="flex h-full flex-col bg-canvas p-8 lg:p-10">
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-body-sm font-medium text-fg-muted"
        >
          {initialsOf(profile.fullName)}
        </div>

        <div className="min-w-0">
          <h3 className="text-h3 font-medium">{profile.fullName}</h3>
          {profile.profession ? (
            <p className="mt-1 text-body-sm text-fg-muted">
              {profile.profession}
            </p>
          ) : null}
          {profile.school || profile.gradeYear ? (
            <p className="mt-1 text-body-sm text-fg-subtle">
              {[profile.gradeYear, profile.school].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
      </div>

      {profile.bio ? (
        <p className="mt-6 text-body-sm text-fg-muted text-pretty">
          {profile.bio}
        </p>
      ) : null}

      {profile.funFacts ? (
        <p className="mt-3 text-body-sm text-fg-subtle text-pretty">
          {profile.funFacts}
        </p>
      ) : null}

      {profile.tags.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-2">
          {profile.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-line px-3 py-1 text-body-sm text-fg-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto pt-8">
        {showPairing ? (
          open ? (
            <PairingRequestForm
              recipientProfileId={profile.id}
              recipientName={profile.fullName}
              onDone={() => setOpen(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-full border border-line-strong px-5 py-2 text-body-sm font-medium transition-colors hover:border-fg"
            >
              Request to pair
            </button>
          )
        ) : (
          <p className="text-body-sm text-fg-subtle">
            {relationLabel[profile.relation] ??
              "Not taking pairing requests"}
          </p>
        )}
      </div>
    </article>
  );
}
