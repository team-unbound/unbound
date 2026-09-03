import type { Metadata } from "next";
import Link from "next/link";
import { CopyEmailButton } from "@/components/ui/copy-email-button";
import { Clause, ClauseList, LegalPage } from "@/components/ui/legal";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Unbound collects, who can see it, and how to get it deleted.",
};

const UPDATED = "2026-09-03";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="What we hold, and who can see it"
      updated={UPDATED}
      intro="Unbound is a small community site run by three people. This page says exactly what we store, where it goes, and how to get rid of it. If something here is unclear, ask us and we will fix the wording."
    >
      <Clause heading="Who runs this">
        <p>
          {siteConfig.name} is operated by its three founders, listed on the{" "}
          <Link href="/team">team page</Link>. We are not a company. Questions
          about anything below go to{" "}
          <CopyEmailButton
            email={siteConfig.contactEmail}
            className="text-fg underline underline-offset-4"
          >
            {siteConfig.contactEmail}
          </CopyEmailButton>
          .
        </p>
      </Clause>

      <Clause heading="Signing in">
        <p>
          Accounts are handled by <strong>Clerk</strong>, an external
          authentication provider. When you sign up, Clerk stores your email
          address and whatever credential you sign in with, such as a password
          or a linked account from another provider. Clerk, not us, holds your
          password. Their handling of that data is covered by their own privacy
          policy.
        </p>
        <p>
          We keep a copy of your Clerk user id and your{" "}
          <strong>verified</strong> primary email address so we can match your
          session to your profile. When you change your email address in Clerk,
          we update our copy.
        </p>
      </Clause>

      <Clause heading="Your profile">
        <p>
          Onboarding asks for a few things, all of which you write yourself and
          can edit or blank out at any time from{" "}
          <Link href="/dashboard/settings">your profile settings</Link>:
        </p>
        <ClauseList>
          <li>Your name</li>
          <li>Your school or university, and your grade or year</li>
          <li>What you are building, a short bio, and fun facts</li>
          <li>Skill and interest tags</li>
          <li>Whether you are open to pairing requests</li>
        </ClauseList>
        <p>
          <strong>Treat all of it as public.</strong> Everything in that list
          appears on the community directory, and the first five profiles are
          visible to anyone on the internet, signed in or not. The rest sit
          behind a sign-in wall, which is a speed bump rather than a guarantee:
          anyone can make an account. Do not put anything in your bio that you
          would not put on a public web page.
        </p>
        <p>
          Your email address is the exception. It is never shown on the
          directory and is never part of the data that page loads.
        </p>
      </Clause>

      <Clause heading="Pairing requests">
        <p>
          When you send a pairing request, we store who sent it, who received
          it, the reason you wrote, its status, and the times it was sent and
          answered. <strong>The recipient reads your reason.</strong> Write it
          for them.
        </p>
        <p>
          Email addresses are exchanged on acceptance and only then. While a
          request is pending, neither side sees the other&rsquo;s address. If it
          is declined or cancelled, neither side ever does. Accepting is what
          releases your address to the other person, and once they have it, they
          have it. We cannot claw it back.
        </p>
      </Clause>

      <Clause heading="The newsletter">
        <p>
          Signing up stores your email address and, if you give them, your first
          and last name. We use it to send the Unbound newsletter and nothing
          else. We do not sell it, rent it, or hand it to anyone outside the
          three of us.
        </p>
        <p>
          One address means one subscription. Signing up again with an address
          already on the list changes nothing and does not overwrite the name on
          file. To come off the list, email us and we will delete the row. There
          is no self-serve unsubscribe link yet.
        </p>
      </Clause>

      <Clause heading="Services we hand data to">
        <ClauseList>
          <li>
            <strong>Clerk</strong> for accounts and sessions.
          </li>
          <li>
            <strong>Neon</strong> hosts the database holding profiles, pairing
            requests, events, and newsletter signups.
          </li>
          <li>
            <strong>Vercel</strong> hosts and serves the site, and sees the
            request metadata any web host sees, including your IP address.
          </li>
          <li>
            <strong>Upstash</strong> backs rate limiting. Your IP address is
            used as a counter key on the newsletter form so one connection
            cannot flood signups. It is a key in a short-lived counter, not a
            record of your visit, and it is never joined to your profile.
          </li>
          <li>
            <strong>Sentry</strong> receives error reports when something
            breaks. We have turned off the settings that would send your
            identity or the contents of your requests, so what it gets is stack
            traces and the page an error happened on.
          </li>
        </ClauseList>
        <p>
          Each of these is an independent company with its own privacy policy
          and its own servers, some outside Canada.
        </p>
      </Clause>

      <Clause heading="Cookies">
        <p>
          Clerk sets cookies to keep you signed in. Those are the only cookies
          we deliberately set, and blocking them means you cannot stay signed
          in. We run no advertising trackers, no analytics product, and no
          third-party pixels. Our hosts may set cookies of their own for routing
          or security.
        </p>
      </Clause>

      <Clause heading="Keeping and deleting your data">
        <p>
          We keep your profile until you ask us to delete it. Be aware that
          deleting your account in Clerk removes your sign-in, but{" "}
          <strong>
            it does not by itself remove your profile from our database
          </strong>
          . We have not wired that up yet, so the row stays until we delete it
          by hand. Email us and we will.
        </p>
        <p>
          When we delete your profile, every pairing request you sent or
          received goes with it. Newsletter signups are stored separately and
          are not covered by a profile deletion, so say if you want those gone
          too.
        </p>
        <p>
          There is no self-serve delete button yet. We will confirm from the
          address on file before acting, and we aim to do it within a week.
        </p>
        <p>
          One thing we cannot undo: an email address already released through an
          accepted pairing request is in someone else&rsquo;s hands, and
          deleting your account does not reach it.
        </p>
      </Clause>

      <Clause heading="Age, and what we have not built">
        <p>
          Unbound is aimed at high school and university students, so we expect
          many members to be under 18. We do not ask for your date of birth and
          we have no way to verify anyone&rsquo;s age. If you are under the age
          at which you can agree to this on your own where you live, read it
          with a parent or guardian.
        </p>
        <p>
          We want to be straight about the limits here.{" "}
          <strong>
            We have not built or audited this site against COPPA, GDPR, PIPEDA,
            or any other privacy regime, and we are not claiming compliance with
            any of them.
          </strong>{" "}
          There is no age gate, no parental consent flow, no cookie consent
          banner, no data export tool, and no automated deletion. What we do
          have is a small amount of data, a short list of processors, and an
          email address a real person reads. If you are a parent, guardian, or
          member who wants something removed, write to us and we will remove it.
        </p>
      </Clause>

      <Clause heading="Changes">
        <p>
          If we change what we collect or who we send it to, we will update this
          page and move the date at the top. For anything significant we will
          say so in the newsletter rather than quietly editing.
        </p>
      </Clause>

      <Clause heading="Contact">
        <p>
          Everything on this page, deletion requests included, goes to{" "}
          <CopyEmailButton
            email={siteConfig.contactEmail}
            className="text-fg underline underline-offset-4"
          >
            {siteConfig.contactEmail}
          </CopyEmailButton>
          . See also the <Link href="/terms">terms of service</Link>.
        </p>
      </Clause>
    </LegalPage>
  );
}
