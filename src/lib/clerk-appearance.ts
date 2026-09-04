import type { ComponentProps } from "react";
import type { ClerkProvider } from "@clerk/nextjs";

// `Appearance` isn't re-exported from @clerk/nextjs, so take it off the prop.
type Appearance = NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]>;

/** Keeps Clerk's hosted UI inside the monochrome design system. */
export const clerkAppearance: Appearance = {
  variables: {
    colorBackground: "#0f0f0f",
    colorForeground: "#ffffff",
    colorPrimary: "#ffffff",
    colorPrimaryForeground: "#050505",
    colorInput: "#0f0f0f",
    colorInputForeground: "#ffffff",
    colorBorder: "#242424",
    colorMuted: "#161616",
    colorMutedForeground: "#9a9a9a",
    colorNeutral: "#ffffff",
    colorRing: "#ffffff",
    colorDanger: "#ffffff",
    colorSuccess: "#ffffff",
    colorWarning: "#ffffff",
    borderRadius: "0.6rem",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    cardBox: "border border-line shadow-none",
    card: "bg-surface",
    headerTitle: "text-fg",
    headerSubtitle: "text-fg-muted",
    // Clerk's defaults come out around 32px tall, which is a cursor-sized
    // target on a phone. min-h-11 is 44px.
    socialButtonsBlockButton:
      "border-line hover:border-line-strong min-h-11",
    formFieldInput: "min-h-11",
    formButtonPrimary:
      "bg-fg text-canvas hover:opacity-85 transition-opacity normal-case font-medium min-h-11",
    footer: "bg-surface",
    footerActionLink: "text-fg hover:text-fg underline underline-offset-4",
  },
};
