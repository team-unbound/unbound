"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { navLinks } from "@/lib/site";
import { UserButton, useAuth } from "@clerk/nextjs";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Core 3 removed <SignedIn>/<SignedOut>; the client-side hook is the
  // equivalent inside a client component (<Show> is an async server component).
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Scrim behind the open menu. The panel is only as tall as its links,
          so without this the page carries on immediately under it and the
          first line of hero copy gets sliced in half by the panel's edge.
          Opaque rather than a tint: at 95% the sliced line was still legible
          enough to read as a rendering fault. Sits below the header's z-50 so
          the menu itself stays crisp, and doubles as tap-outside-to-close. */}
      {open ? (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-canvas md:hidden"
        />
      ) : null}

      {/* The open menu needs a solid bar background rather than the scrolled
          bar's translucent one, or the hero headline reads straight through
          the links. The collapsed bar keeps the translucent treatment. */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          open
            ? "border-b border-line bg-canvas"
            : scrolled
              ? "border-b border-line bg-canvas/85 backdrop-blur-md"
              : "border-b border-transparent"
        }`}
      >
        <div className="shell flex h-16 items-center justify-between">
          <Logo />

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-body-sm transition-colors ${
                    active ? "text-fg" : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {isLoaded ? (
              isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden rounded-full border border-line-strong px-5 py-2 text-body-sm font-medium transition-colors hover:border-fg md:inline-flex"
                  >
                    Dashboard
                  </Link>
                  <UserButton />
                </>
              ) : (
                <Link
                  href="/sign-in"
                  className="hidden rounded-full border border-line-strong px-5 py-2 text-body-sm font-medium transition-colors hover:border-fg md:inline-flex"
                >
                  Sign in
                </Link>
              )
            ) : (
              // Reserve the space so the header doesn't jump once Clerk loads.
              <div aria-hidden="true" className="hidden h-9 w-24 md:block" />
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong md:hidden"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
                <path
                  d={open ? "M3 3l10 10M13 3L3 13" : "M2 5h12M2 11h12"}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <nav
            id="mobile-nav"
            className="shell pb-6 md:hidden"
            aria-label="Mobile"
          >
            <ul className="flex flex-col gap-1 border-t border-line pt-4">
              {[
                ...navLinks,
                isSignedIn
                  ? { href: "/dashboard", label: "Dashboard" }
                  : { href: "/sign-in", label: "Sign in" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-3 text-h3 text-fg-muted transition-colors hover:text-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}
