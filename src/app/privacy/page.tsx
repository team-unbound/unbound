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

const UPDATED = "2026-10-23";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="What we hold, and who can see it"
      updated={UPDATED}
      intro="Unbound is a small community site run by three people. This page says exactly what we store, where it goes, and how to get rid of it. If something here is unclear, ask us and we will fix the wording. This page covers the Unbound website and the Unbound app."
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
        <p>
          The Unbound app also uses Clerk. In the app you can sign in with an
          email code, or with your Apple or Google account.
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

      <Clause heading="Device information">
        <p>
          The Unbound app uses an identifier for your device. On Android it is
          the device&rsquo;s Android ID. On iPhone it is a random code the app
          creates and keeps in the iPhone Keychain. Either one can survive
          deleting and reinstalling the app. The app sends it to our server when
          it checks your account.
        </p>
        <p>
          We do not save it in our database as it is. Our server turns it into a
          scrambled, one-way code using a secret key that only we hold, and we
          keep only that code with your account. We use it for one thing:
          limiting how many accounts can be made from a single device, so the
          community stays real. We do not use it to follow you across other apps
          or sites, and we do not sell it.
        </p>
      </Clause>

      <Clause heading="The app and your posts">
        <p>
          The Unbound app stores more than this website does. On top of your
          profile, that means your username, your date of birth, your pronouns,
          a tagline, the avatar style you pick, what you say you are building,
          the interests you choose, and any startups or experience you add. Your
          date of birth is used to check that you are at least 17. It is stored
          with your account and is never shown to other people.
        </p>
        <p>
          It also stores everything you post: photos (up to six per post),
          captions, text, tags, comments, likes, saves, and reports you file. We
          count how many times each post is viewed and keep track of which
          account viewed it.
        </p>
        <p>
          Posts, comments and profiles are visible to other people using the
          app, so do not post anything you would not put on a public web page.
          The photos are stored with Vercel.
        </p>
      </Clause>

      <Clause heading="Drafts on your phone">
        <p>
          While you write a post, the app keeps a draft on your phone: the text,
          the tags, and copies of the photos you picked. It is not sent to us
          until you tap Post. A draft expires 30 minutes after your last edit,
          and the app clears it from your phone the next time you tap the plus
          button. Each account on a phone has its own draft.
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
          else. We do not sell it, rent it, or hand it to anyone other than the
          services listed below.
        </p>
        <p>
          One address means one subscription. Signing up again with an address
          already on the list changes nothing and does not overwrite the name on
          file. To come off the list, email us and we will delete the row. There
          is no self-serve unsubscribe link yet.
        </p>
      </Clause>

      <Clause heading="Event signups">
        <p>
          When you sign up for an event, we store your name, email, age, and
          grade/year, along with the fact that you confirmed you&rsquo;re
          committed to attending. We use this to plan the event and follow up
          if details change. We don&rsquo;t share this with anyone other than
          the services listed below.
        </p>
      </Clause>

      <Clause heading="The app waitlist">
        <p>
          The waitlist form on this website collects your email address, your
          full name, who you are, what you are building, your city, your school,
          how you heard about us, your phone type, and whether you are 17 or
          older. We use it to run the waitlist and plan the launch of the app.
          It is stored in our database. We do not sell it, and we do not hand it
          to anyone other than the services listed below. To be taken off the
          list, email us and we will delete your entry.
        </p>
      </Clause>

      <Clause heading="Services we hand data to">
        <ClauseList>
          <li>
            <strong>Clerk</strong> for accounts and sessions.
          </li>
          <li>
            <strong>Neon</strong> hosts the database holding profiles, pairing
            requests, events, event signups, and newsletter signups. It also
            holds waitlist signups, and the accounts, posts and other data of
            the Unbound app.
          </li>
          <li>
            <strong>Vercel</strong> hosts and serves the site, and sees the
            request metadata any web host sees, including your IP address. It
            also stores the photos people post in the Unbound app. This website
            also uses Vercel Analytics to count visits to its pages.
          </li>
          <li>
            <strong>Upstash</strong> backs rate limiting. Your IP address is
            used as a counter key on the newsletter and event signup forms so
            one connection cannot flood signups. On the website forms, it is a
            key in a short-lived counter, not a record of your visit, and it is
            never joined to your profile. In the Unbound app the counter is
            keyed to your account, or to your IP address when you are signed
            out. The waitlist form uses your email address as a counter key.
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
          in. We run no advertising trackers and no third-party pixels. The site
          uses Vercel Analytics to count visits to its pages. According to
          Vercel, it does this without cookies, using an anonymised hash of each
          request. Our hosts may set cookies of their own for routing or
          security.
        </p>
      </Clause>

      <Clause heading="Keeping and deleting your data">
        <p>
          The first part of this section describes the website. The last
          paragraph describes the Unbound app.
        </p>
        <p>
          We keep your profile for as long as your account exists.{" "}
          <strong>
            Deleting your account in Clerk deletes your website profile here
            too.
          </strong>{" "}
          Clerk tells us the moment you do, and we remove your profile row and
          every pairing request you sent or received, including the reasons you
          wrote and the ones written to you. On the website it is a real delete,
          not a hidden flag, and there is no copy kept behind it.
        </p>
        <p>
          Newsletter and waitlist signups are the exception. Those lists are
          keyed on an email address and have no link to your account, because
          you can sign up without one, so deleting your account leaves your
          subscription or waitlist entry alone. Email us if you want off those
          lists as well.
        </p>
        <p>
          You can also just ask. If you would rather we deleted your profile
          without you touching Clerk, write to us. We will confirm from the
          address on file first, and we aim to do it within a week.
        </p>
        <p>
          One thing we cannot undo: an email address already released through an
          accepted pairing request is in someone else&rsquo;s hands, and
          deleting your account does not reach it.
        </p>
        <p>
          The Unbound app works differently for now: deleting a post or a
          comment hides it from other people in the app, but we keep it on our
          servers with no set deletion date. The app has no delete-account
          button yet. To have your app data removed, email us and we will delete
          it.
        </p>
      </Clause>

      <Clause heading="Age, and what we have not built">
        <p>
          Unbound is aimed at high school and university students, so we expect
          many members to be under 18. The website does not ask for your date of
          birth. The Unbound app does, and it will not let anyone under 17 sign
          up. We have no way to verify anyone&rsquo;s age, so that check relies
          on the date a person enters. If you are under the age
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
          The website has no age gate (the app has the 17 minimum described
          above), and there is no parental consent flow, no cookie consent
          banner, and no data export tool. On the website, deleting your account
          does now erase your profile automatically, but everything else here
          runs on people rather than tooling. What we do have is a short list of
          processors, and an email address a real person reads. If you are a
          parent, guardian, or member who wants something removed, write to us
          and we will remove it.
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
