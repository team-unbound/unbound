// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  dataCollection: {
    // This app handles member emails, bios and pairing reasons. Don't ship
    // user identity or request bodies to Sentry; stack traces are enough.
    userInfo: false,
    httpBodies: [],
  },
});
