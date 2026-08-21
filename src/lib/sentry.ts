import * as Sentry from "@sentry/react";

// Optional: no-ops entirely if VITE_SENTRY_DSN isn't set, so this works
// with zero setup and activates the moment a DSN is added to env vars.
// Create a free project at sentry.io, Settings > Client Keys (DSN), and
// set VITE_SENTRY_DSN locally and in Vercel to turn this on.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;
