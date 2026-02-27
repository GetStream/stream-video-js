import * as Sentry from '@sentry/react';

const sentryDsn = import.meta.env.VITE_EGRESS_SENTRY_DNS;
const sentryEnabled = import.meta.env.MODE === 'production' && !!sentryDsn;

if (sentryEnabled) {
  Sentry.init({
    dsn: sentryDsn,
    tracePropagationTargets: ['video-layout.getstream.io'],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
      // Sentry.captureConsoleIntegration(),
    ],
    tracesSampleRate: 0.9,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    attachStacktrace: true,
    maxBreadcrumbs: 10,
  });
}

void import('./main').catch(async (error) => {
  if (sentryEnabled) {
    Sentry.captureException(error, {
      tags: { phase: 'bootstrap-import' },
    });
    await Sentry.flush(2000);
  }

  throw error;
});
