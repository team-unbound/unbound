import type { Metadata } from "next";
import Link from "next/link";
import { ProfileForm } from "@/components/profile/profile-form";
import { Section } from "@/components/ui/section";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile settings" };

export default async function ProfileSettingsPage() {
  const profile = await requireProfile();

  return (
    <Section className="pt-40 lg:pt-48">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-body-sm text-fg-muted transition-colors hover:text-fg"
      >
        <span aria-hidden="true">&larr;</span>
        Back to dashboard
      </Link>

      <div className="mt-8 max-w-2xl">
        <span className="eyebrow">Settings</span>
        <h1 className="mt-8 text-h1 font-medium text-balance">Your profile</h1>
        <p className="mt-6 text-body-lg text-fg-muted text-pretty">
          This is what the community directory shows about you. Your email
          address is not on it: members only see it after you accept their
          pairing request.
        </p>
      </div>

      <div className="mt-12 max-w-2xl rounded-2xl border border-line bg-surface p-8 lg:p-10">
        <ProfileForm profile={profile} />
      </div>

      <div className="mt-8 max-w-2xl rounded-2xl border border-dashed border-line p-8">
        <h2 className="text-h3 font-medium">Account and sign-in</h2>
        <p className="mt-3 text-body-sm text-fg-muted text-pretty">
          Your name on the sign-in screen, your password and your email address
          live with Clerk, not here. Open the avatar menu in the top right to
          change them. We pick up a new email address on your next visit.
        </p>
        <p className="mt-4 text-body-sm text-fg-subtle text-pretty">
          Want your profile deleted? Email us and we will remove it, along with
          every pairing request you sent or received. See the{" "}
          <Link
            href="/privacy"
            className="text-fg underline underline-offset-4"
          >
            privacy policy
          </Link>
          .
        </p>
      </div>
    </Section>
  );
}
