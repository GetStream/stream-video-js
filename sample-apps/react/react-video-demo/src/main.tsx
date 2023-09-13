import ReactDOM from 'react-dom/client';
import App from './App';

import * as Sentry from '@sentry/react';

import Gleap from 'gleap';

import './index.css';
import TagManager from 'react-gtm-module';

if (import.meta.env.VITE_GTM_ID) {
  const tagManagerArgs = {
    gtmId: import.meta.env.VITE_GTM_ID,
    dataLayer: {
      userProject: import.meta.env.VITE_GTM_PROJECT,
    },
  };

  TagManager.initialize(tagManagerArgs);
}

if (
  import.meta.env.MODE === 'staging' ||
  import.meta.env.MODE === 'production'
) {
  Sentry.init({
    environment:
      import.meta.env.MODE === 'production' ? 'production' : 'staging',
    dsn: import.meta.env.VITE_VIDEO_DEMO_SENTRY_DNS,
    integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
    maxBreadcrumbs: import.meta.env.MODE === 'staging' ? 50 : 10,
    debug: import.meta.env.MODE === 'staging',
    tracesSampleRate: import.meta.env.MODE === 'staging' ? 0.5 : 0.9,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

if (import.meta.env.MODE === 'staging') {
  Gleap.initialize(import.meta.env.VITE_GLEAP_KEY);
}

ReactDOM.createRoot(
  document.getElementById('video-demo') as HTMLElement,
).render(<App />);
