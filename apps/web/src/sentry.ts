import * as Sentry from '@sentry/react';

// Sans VITE_SENTRY_DSN, cet appel est un no-op — l'app fonctionne normalement,
// Sentry reste simplement inactif.
const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 0.1,
    // Volume de sessions rejouées gardé bas par défaut (coût de stockage) —
    // toutes les sessions ayant rencontré une erreur sont capturées.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
