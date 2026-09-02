import { siteConfig } from "./site";

export type TeamMember = {
  name: string;
  role: string;
  initials: string;
  /** Prefilled mailto to the shared inbox, addressed to this person. */
  mailto: string;
};

function mailtoFor(name: string) {
  const subject = encodeURIComponent(`Hello ${name.split(" ")[0]} — via unbound.`);
  return `mailto:${siteConfig.contactEmail}?subject=${subject}`;
}

export const team: TeamMember[] = [
  {
    name: "Raisa Farhin",
    role: "Co-founder",
    initials: "RF",
    mailto: mailtoFor("Raisa Farhin"),
  },
  {
    name: "Muskan Waraich",
    role: "Co-founder",
    initials: "MW",
    mailto: mailtoFor("Muskan Waraich"),
  },
  {
    name: "Shahmeer Khan",
    role: "Co-founder",
    initials: "SK",
    mailto: mailtoFor("Shahmeer Khan"),
  },
];
