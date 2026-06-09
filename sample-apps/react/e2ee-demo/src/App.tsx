import { useEffect } from 'react';
import { HarnessProvider, useCreateHarness } from './hooks/useHarness';
import { ControlBar } from './components/ControlBar';
import { CallGrid } from './components/CallGrid';
import { resolveCallId, writeUrl } from './harness/url';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import './App.css';

const App = () => {
  const callId = resolveCallId(window.location.search);
  const engine = useCreateHarness(callId);

  // Reflect the call id in the URL so the harness is bookmarkable and shareable.
  useEffect(() => {
    writeUrl(callId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HarnessProvider value={engine}>
      <div className="app">
        <ControlBar />
        <CallGrid />
      </div>
    </HarnessProvider>
  );
};

export default App;
