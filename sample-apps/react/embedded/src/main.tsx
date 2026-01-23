import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ConfigurationProvider } from './context/ConfigurationContext.tsx';
import App from './App';

import './index.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigurationProvider>
      <App />
    </ConfigurationProvider>
  </StrictMode>,
);
