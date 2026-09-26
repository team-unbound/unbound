export type TeamMember = {
  name: string;
  role: string;
  /** Path under /public. Square-cropped at render, so near-square art works best. */
  avatar: string;
};

export const team: TeamMember[] = [
  { name: "Raisa Farhin", role: "Co-founder", avatar: "/team/raisa.jpeg" },
  { name: "Muskan Waraich", role: "Co-founder", avatar: "/team/muskan.jpeg" },
  { name: "Shahmeer Khan", role: "Co-founder", avatar: "/team/shahmeer.jpeg" },
];
