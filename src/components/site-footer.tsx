import Link from "next/link";
import { Logo } from "./logo";
import { navLinks, siteConfig } from "@/lib/site";
import { InstagramIcon, LinkedInIcon, MailIcon, YouTubeIcon } from "./icons";
import { CopyEmailButton } from "./ui/copy-email-button";

const socials = [
  { href: siteConfig.socials.youtube, label: "YouTube", Icon: YouTubeIcon },
  { href: siteConfig.socials.linkedin, label: "LinkedIn", Icon: LinkedInIcon },
  {
    href: siteConfig.socials.instagram,
    label: "Instagram",
    Icon: InstagramIcon,
  },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="shell py-16">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-5 text-body-sm text-fg-muted text-pretty">
              {siteConfig.description}
            </p>
            <CopyEmailButton
              email={siteConfig.contactEmail}
              className="mt-6 inline-flex items-center gap-2 text-body-sm text-fg-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
            >
              <MailIcon className="h-4 w-4" />
              {siteConfig.contactEmail}
            </CopyEmailButton>
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-20">
            <nav aria-label="Footer">
              <h2 className="text-label uppercase tracking-[0.18em] text-fg-subtle">
                Explore
              </h2>
              <ul className="mt-2 flex flex-col sm:mt-4 sm:gap-2.5">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block py-2 text-body-sm text-fg-muted transition-colors hover:text-fg sm:py-0"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className="text-label uppercase tracking-[0.18em] text-fg-subtle">
                Follow
              </h2>
              <ul className="mt-4 flex items-center gap-3">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-fg hover:text-fg"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 text-body-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights
            reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-2 transition-colors hover:text-fg sm:py-0"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li aria-hidden="true" className="hidden sm:block">
              Built by builders.
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
