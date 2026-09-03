import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts` (Node runtime only).
 * Clerk's `clerkMiddleware` runs here unchanged.
 */

/** Everything that must NOT require a signed-in user. */
const isPublicRoute = createRouteMatcher([
  "/",
  "/about",
  "/team",
  "/events",
  "/newsletter",
  "/community",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/health",
  // Verified by Svix signature inside the handler, not a Clerk session —
  // this is a server-to-server call from Clerk, never a signed-in browser.
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // Redirects signed-out users to the sign-in page.
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files unless referenced in search params.
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
