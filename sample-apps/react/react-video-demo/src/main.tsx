import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import TagManager from 'react-gtm-module';

if (import.meta.env.MODE === 'production') {
  const tagManagerArgs = {
    gtmId: import.meta.env.VITE_GTM_ID,
    dataLayer: {
      userProject: import.meta.env.VITE_GTM_PROJECT,
    },
  };

  TagManager.initialize(tagManagerArgs);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />,
);
