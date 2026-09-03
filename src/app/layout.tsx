import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { MotionConfig } from "motion/react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { siteConfig } from "@/lib/site";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Clerk Core 3 requires ClerkProvider to live inside <body>. */}
      <body className="flex min-h-full flex-col bg-canvas text-fg">
        <ClerkProvider appearance={clerkAppearance}>
          {/* Respects the OS reduced-motion preference for every Motion
              component site-wide, without any component branching on it
              itself — branching render output on useReducedMotion() causes
              a hydration mismatch, since SSR can't know the client's OS
              setting. This applies the preference after mount instead. */}
          <MotionConfig reducedMotion="user">
            <ToastProvider>
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-body-sm focus:text-canvas"
              >
                Skip to content
              </a>
              <SiteHeader />
              <main id="main" className="flex flex-1 flex-col">
                {children}
              </main>
              <SiteFooter />
            </ToastProvider>
          </MotionConfig>
        </ClerkProvider>
      </body>
    </html>
  );
}
