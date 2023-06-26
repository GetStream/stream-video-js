// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn:
    SENTRY_DSN ||
    'https://fe0b0bd8c3244e9fa3cb8e252f4a4ceb@o14368.ingest.sentry.io/4504044576374784',
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampler: samplingContext => {
    if (Object.keys(samplingContext.request?.headers || {}).includes('x-react-dogfood-no-trace')) {
      return 0.0;
    } else {
      return 1.0;
    }
  }
  // ...
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});
