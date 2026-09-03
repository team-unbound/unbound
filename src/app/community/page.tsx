import type { Metadata } from "next";
import Link from "next/link";
import { ProfileCard } from "@/components/community/profile-card";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { getCommunityProfiles } from "@/db/community";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Community",
  description: "The people building inside Unbound.",
};

export default async function CommunityPage() {
  // Redirects to sign-in, or to onboarding if the profile isn't finished.
  const viewer = await requireProfile();
  const members = await getCommunityProfiles(viewer.id);

  return (
    <Section className="pt-40 lg:pt-48">
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
        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, i) => (
            <Reveal
              key={member.id}
              delay={Math.min(i, 6) * 0.05}
              className="bg-canvas"
            >
              <ProfileCard profile={member} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="mt-16 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-body-sm text-fg-muted">
            No profiles yet. Yours will show up here once you finish
            onboarding.
          </p>
        </div>
      )}
    </Section>
  );
}
