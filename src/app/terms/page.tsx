import type { Metadata } from "next";
import Link from "next/link";
import { CopyEmailButton } from "@/components/ui/copy-email-button";
import { Clause, ClauseList, LegalPage } from "@/components/ui/legal";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: "The rules for using Unbound, in plain language.",
};

const UPDATED = "2026-09-03";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="The rules, in plain language"
      updated={UPDATED}
      intro="Short version: be a decent person, do not misuse other members' contact details, and understand that this is a side project run by three students rather than a product with a support team behind it."
    >
      <Clause heading="Agreeing to this">
        <p>
          Using {siteConfig.name} means you accept what is on this page and in
          the <Link href="/privacy">privacy policy</Link>. If you do not, stop
          using the site.
        </p>
        <p>
          If you are under the age at which you can agree to something like this
          where you live, go through it with a parent or guardian first. We do
          not verify anyone&rsquo;s age.
        </p>
      </Clause>

      <Clause heading="Your account">
        <p>
          One account per person, signed up under a name people would recognise
          you by. You are responsible for what happens under your account, so
          keep your sign-in details to yourself.
        </p>
        <p>
          Your profile has to be about you. Do not sign up as someone else, as a
          made-up person, or as a brand.
        </p>
      </Clause>

      <Clause heading="What you post">
        <p>
          You keep ownership of your bio, tags, fun facts, and pairing request
          reasons. By putting them here you let us display them on the site to
          the people described in the privacy policy, which for most of it means
          the public.
        </p>
        <p>Do not post:</p>
        <ClauseList>
          <li>
            Anything harassing, hateful, or targeted at someone because of who
            they are
          </li>
          <li>Sexual content, or anything sexualising a minor</li>
          <li>Someone else&rsquo;s personal information</li>
          <li>Spam, ads, recruitment funnels, or link farms</li>
          <li>Work that is not yours, presented as yours</li>
          <li>Anything illegal where you are</li>
        </ClauseList>
      </Clause>

      <Clause heading="Pairing requests and other members' emails">
        <p>
          This is the part that matters most. Pairing exists so two people can
          get in touch about building something. When someone accepts your
          request, you get their email address on that basis alone.
        </p>
        <p>Having someone&rsquo;s address does not entitle you to:</p>
        <ClauseList>
          <li>Add them to a mailing list, newsletter, or group chat</li>
          <li>Pitch them a product, service, or investment</li>
          <li>Pass it to anyone else, including a co-founder or a tool</li>
          <li>Keep messaging after they ask you to stop</li>
        </ClauseList>
        <p>
          Send a request only when you actually want to work with the person,
          and write a reason a real human would want to answer. Declining is
          always fine and needs no explanation.
        </p>
      </Clause>

      <Clause heading="Events">
        <p>
          Events listed here are run by us or by members. Details can change or
          be cancelled, sometimes late. Anything you do at an event is on you,
          and organisers may set their own rules on top of these.
        </p>
      </Clause>

      <Clause heading="The newsletter">
        <p>
          Subscribing means we can email you the newsletter. Ask us and we take
          you off the list.
        </p>
      </Clause>

      <Clause heading="Suspension and removal">
        <p>
          We can remove a profile, a pairing request, or an account that breaks
          these rules, and we can do it without warning if someone is being
          harmed. We will tell you why when we can.
        </p>
        <p>
          You can leave whenever you want. Deleting your account in Clerk stops
          you signing in, and emailing us removes your profile and every pairing
          request attached to it. Both steps are worth doing, and the{" "}
          <Link href="/privacy">privacy policy</Link> explains why.
        </p>
      </Clause>

      <Clause heading="What we do not promise">
        <p>
          The site is provided as it is. We do not promise it will be up, that
          it will be free of bugs, or that anyone will accept your pairing
          request. Features can change or disappear.
        </p>
        <p>
          <strong>We do not vet members.</strong> A profile here is a claim
          someone typed about themselves, not something we verified. Use the
          same judgement you would use meeting anyone from the internet: meet
          somewhere public, tell someone where you are going, and stop talking
          to anyone who makes you uncomfortable. If someone on Unbound is
          behaving badly, tell us.
        </p>
        <p>
          As far as the law allows, we are not liable for what happens between
          members, for anything you lose through using the site, or for what
          another member does with information you chose to share.
        </p>
      </Clause>

      <Clause heading="Changes to these terms">
        <p>
          We will update this page and move the date at the top when the rules
          change. Carrying on using the site after that means the new version
          applies to you.
        </p>
      </Clause>

      <Clause heading="Contact">
        <p>
          Reports, questions, and appeals go to{" "}
          <CopyEmailButton
            email={siteConfig.contactEmail}
            className="text-fg underline underline-offset-4"
          >
            {siteConfig.contactEmail}
          </CopyEmailButton>
          . We read them.
        </p>
      </Clause>
    </LegalPage>
  );
}
