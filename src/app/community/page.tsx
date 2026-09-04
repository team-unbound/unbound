import type { Metadata } from "next";
import Link from "next/link";
import { BlurredProfileCard } from "@/components/community/blurred-profile-card";
import { ProfileCard } from "@/components/community/profile-card";
import { PublicProfileCard } from "@/components/community/public-profile-card";
import { CardGrid } from "@/components/ui/card-grid";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import {
  getCommunityProfiles,
  getPublicCommunityPreview,
} from "@/db/community";
import { getCurrentProfile, getUserId } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Community",
  description: "The people building inside Unbound.",
};

const PREVIEW_LIMIT = 5;
const MAX_PLACEHOLDER_CARDS = 6;

async function SignedInCommunity({ profileId }: { profileId: string }) {
  const members = await getCommunityProfiles(profileId);

  return (
    <>
      <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <span className="eyebrow">Community</span>
          <h1 className="mt-8 text-h1 font-medium text-balance">
            {members.length === 1
              ? "You're the first one here."
              : "Everyone building right now."}
          </h1>
          <p className="mt-6 text-body-lg text-fg-muted text-pretty">
            Send a pairing request with a real reason. Emails are only
            exchanged when someone accepts.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="shrink-0 rounded-full border border-line-strong px-5 py-2 text-body-sm font-medium transition-colors hover:border-fg"
        >
          Your requests
        </Link>
      </Reveal>

      {members.length > 0 ? (
        <CardGrid count={members.length} className="mt-16">
          {members.map((member, i) => (
            <Reveal
              key={member.id}
              delay={Math.min(i, 6) * 0.05}
              className="bg-canvas"
            >
              <ProfileCard profile={member} />
            </Reveal>
          ))}
        </CardGrid>
      ) : (
        <div className="mt-16 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-body-sm text-fg-muted">
            No profiles yet. Yours will show up here once you finish
            onboarding.
          </p>
        </div>
      )}
    </>
  );
}

async function PublicCommunityPreview({
  ctaHref = "/sign-in",
  ctaLabel = "Sign in / Sign up",
}: {
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const { visible, totalCount } = await getPublicCommunityPreview(PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, totalCount - visible.length);
  const placeholderCount = Math.min(hiddenCount, MAX_PLACEHOLDER_CARDS);

  return (
    <>
      <Reveal className="max-w-xl">
        <span className="eyebrow">Community</span>
        <h1 className="mt-8 text-h1 font-medium text-balance">
          The people building inside Unbound.
        </h1>
        <p className="mt-6 text-body-lg text-fg-muted text-pretty">
          A preview of who&rsquo;s here. Sign in to see everyone and send
          pairing requests.
        </p>
      </Reveal>

      {visible.length > 0 ? (
        <CardGrid count={visible.length + placeholderCount} className="mt-16">
          {visible.map((member, i) => (
            <Reveal
              key={member.id}
              delay={Math.min(i, 6) * 0.05}
              className="bg-canvas"
            >
              <PublicProfileCard profile={member} />
            </Reveal>
          ))}

          {Array.from({ length: placeholderCount }).map((_, i) => (
            <BlurredProfileCard key={`placeholder-${i}`} variant={i} />
          ))}
        </CardGrid>
      ) : (
        <div className="mt-16 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-body-sm text-fg-muted">
            No profiles yet. Be the first to join.
          </p>
        </div>
      )}

      {hiddenCount > 0 ? (
        <Reveal className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-10 text-center">
          <p className="max-w-sm text-body-lg text-fg-muted text-pretty">
            {hiddenCount === 1
              ? "There's one more builder in Unbound."
              : `There are ${hiddenCount} more builders in Unbound.`}
          </p>
          <Link
            href={ctaHref}
            className="rounded-full bg-fg px-7 py-3 text-body-sm font-medium text-canvas transition-opacity hover:opacity-85"
          >
            {ctaHref === "/sign-in" ? "Want to see it all? " : ""}
            {ctaLabel}
          </Link>
        </Reveal>
      ) : (
        <Reveal className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface p-10 text-center">
          <p className="max-w-sm text-body-lg text-fg-muted text-pretty">
            Join to send pairing requests and show up on this page yourself.
          </p>
          <Link
            href={ctaHref}
            className="rounded-full bg-fg px-7 py-3 text-body-sm font-medium text-canvas transition-opacity hover:opacity-85"
          >
            {ctaLabel}
          </Link>
        </Reveal>
      )}
    </>
  );
}

export default async function CommunityPage() {
  const userId = await getUserId();
  const profile = userId ? await getCurrentProfile() : null;

  return (
    <Section className="pt-40 lg:pt-48">
      {profile?.onboardedAt ? (
        <SignedInCommunity profileId={profile.id} />
      ) : userId ? (
        // Signed in, but hasn't finished onboarding yet.
        <PublicCommunityPreview
          ctaHref="/onboarding"
          ctaLabel="Finish your profile to see everyone"
        />
      ) : (
        <PublicCommunityPreview />
      )}
    </Section>
  );
}
