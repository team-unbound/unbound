export const siteConfig = {
  name: "Unbound",
  tagline: "Your Vision. Our Digital Reality.",
  description:
    "Unbound is a community for ambitious builders — students, young founders, and creators shipping the things they can't stop thinking about.",
  url: "https://beunbound.me",
  /** Timezone event dates are displayed in. */
  timeZone: "America/Toronto",
  contactEmail: "beunbound.me@gmail.com",
  socials: {
    youtube: "https://youtube.com/@unbounding_",
    linkedin: "https://www.linkedin.com/company/become-unbound",
    instagram: "https://www.instagram.com/Unbound.x",
  },
} as const;

export const navLinks = [
  { href: "/about", label: "About" },
  { href: "/community", label: "Community" },
  { href: "/events", label: "Events" },
  { href: "/team", label: "Team" },
  { href: "/newsletter", label: "Newsletter" },
] as const;
