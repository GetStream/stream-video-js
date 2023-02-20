import { createRoot } from 'react-dom/client';
import { CompositeApp } from './CompositeApp';

import '@stream-io/video-styling/dist/css/styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <CompositeApp />,
);
