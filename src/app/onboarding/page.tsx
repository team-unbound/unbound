import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { Section } from "@/components/ui/section";
import { getCurrentProfile, requireUserId } from "@/lib/auth";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  await requireUserId();
  const profile = await getCurrentProfile();

  // Already onboarded — editing happens on the dashboard.
  if (profile?.onboardedAt) redirect("/dashboard");

  return (
    <Section className="pt-40 lg:pt-48">
      <div className="mx-auto max-w-2xl">
        <span className="eyebrow">One last step</span>
        <h1 className="mt-8 text-h1 font-medium text-balance">
          Tell the community who you are.
        </h1>
        <p className="mt-6 text-body-lg text-fg-muted text-pretty">
          This is what other members see on your card. Your email address is
          never shown — it&rsquo;s only shared when you accept a pairing
          request.
        </p>

        <div className="mt-12">
          <ProfileForm
            profile={profile}
            submitLabel="Join the community"
            redirectTo="/dashboard"
          />
        </div>
      </div>
    </Section>
  );
}
