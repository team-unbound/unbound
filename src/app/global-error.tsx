"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Replaces the root layout when a render fails, so it cannot rely on the
 * app's stylesheet being applied — all styling here is inline on purpose.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#050505",
          color: "#ffffff",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "1.5rem",
        }}
      >
        <main style={{ maxWidth: "34rem", textAlign: "center" }}>
          <p
            style={{
              fontSize: "0.6875rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#9a9a9a",
              margin: 0,
            }}
          >
            Unbound
          </p>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              fontWeight: 500,
              margin: "1.5rem 0 0",
            }}
          >
            Something broke on our end.
          </h1>

          <p
            style={{
              fontSize: "1rem",
              lineHeight: 1.65,
              color: "#9a9a9a",
              margin: "1rem 0 0",
            }}
          >
            The error has been reported and we&rsquo;re on it. Try again — and
            if it keeps happening, email{" "}
            <a
              href="mailto:beunbound.me@gmail.com"
              style={{ color: "#ffffff", textUnderlineOffset: "4px" }}
            >
              beunbound.me@gmail.com
            </a>
            .
          </p>

          <div
            style={{
              marginTop: "2.5rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: "pointer",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#ffffff",
                color: "#050505",
                padding: "0.75rem 1.75rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                fontFamily: "inherit",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                borderRadius: "9999px",
                border: "1px solid #3a3a3a",
                color: "#ffffff",
                padding: "0.75rem 1.75rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Back home
            </a>
          </div>

          {error.digest ? (
            <p
              style={{
                marginTop: "2rem",
                fontSize: "0.875rem",
                color: "#6b6b6b",
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
