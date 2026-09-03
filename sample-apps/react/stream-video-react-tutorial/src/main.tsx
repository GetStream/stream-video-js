import ReactDOM from 'react-dom/client';
import App from './App';

// NOTE: StrictMode is intentionally disabled for this tutorial.
// In dev, StrictMode double-invokes effects (mount → unmount → remount), which
// causes `client.call(...).join(...)` to fire twice; the SFU occasionally keeps
// both sessions alive for a beat, showing the same user as two participants.
// Re-enable if you want to stress-test effect cleanup correctness.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />,
);
