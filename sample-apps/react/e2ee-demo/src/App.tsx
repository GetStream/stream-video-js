import { useEffect, useState } from 'react';
import { HarnessProvider, useCreateHarness } from './hooks/useHarness';
import { ControlBar } from './components/ControlBar';
import { KeyOverridePanel } from './components/KeyOverridePanel';
import { CallGrid } from './components/CallGrid';
import { resolveCallId, writeUrl } from './harness/url';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import './App.css';

const App = () => {
  const callId = resolveCallId(window.location.search);
  const engine = useCreateHarness(callId);
  const [showKeys, setShowKeys] = useState(false);

  // Reflect the call id in the URL so the harness is bookmarkable and shareable.
  useEffect(() => {
    writeUrl(callId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HarnessProvider value={engine}>
      <div className="app">
        <ControlBar
          showKeys={showKeys}
          onToggleKeys={() => setShowKeys((v) => !v)}
        />
        <KeyOverridePanel open={showKeys} onClose={() => setShowKeys(false)} />
        <CallGrid />
      </div>
    </HarnessProvider>
  );
};

export default App;
