import * as Sentry from '@sentry/nestjs';

// Doit être importé avant tout autre module (voir main.ts) pour que
// l'instrumentation Sentry puisse patcher les librairies correctement.
// Sans SENTRY_DSN, cet appel est un no-op — l'API démarre normalement.
const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
  });
}
