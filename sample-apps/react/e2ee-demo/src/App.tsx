import { useE2EEDemo } from './hooks/useE2EEDemo';
import { Header } from './components/Header';
import { ParticipantGrid } from './components/ParticipantGrid';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import './App.css';

const App = () => {
  const {
    callId,
    participants,
    eventsByUser,
    loading,
    e2eeEnabled,
    preferredCodec,
    setPreferredCodec,
    sharedPassphrase,
    setSharedKey,
    toggleE2EE,
    toggleParticipantE2EE,
    addParticipant,
    removeParticipant,
    rotateKey,
    setKeyFromInput,
    dismissError,
  } = useE2EEDemo();

  return (
    <div className="app">
      <Header
        callId={callId}
        participantCount={participants.length}
        e2eeEnabled={e2eeEnabled}
        preferredCodec={preferredCodec}
        sharedPassphrase={sharedPassphrase}
        onToggleE2EE={toggleE2EE}
        onCodecChange={setPreferredCodec}
        onSetSharedKey={setSharedKey}
        onAddParticipant={addParticipant}
        loading={loading}
      />
      <ParticipantGrid
        participants={participants}
        eventsByUser={eventsByUser}
        onRemove={removeParticipant}
        onToggleE2EE={toggleParticipantE2EE}
        onRotateKey={rotateKey}
        onSetKey={setKeyFromInput}
        onDismissError={dismissError}
      />
    </div>
  );
};

export default App;
