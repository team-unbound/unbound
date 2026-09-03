import type { PublicProfile } from "@/db/community";
import { initialsOf } from "@/lib/format";

/**
 * Read-only card for anonymous visitors — same public columns as the signed-in
 * grid, minus any pairing UI (there's no viewer to send a request as).
 */
export function PublicProfileCard({ profile }: { profile: PublicProfile }) {
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
    </article>
  );
}
