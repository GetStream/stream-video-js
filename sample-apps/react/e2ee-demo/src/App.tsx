import { useE2EEDemo } from './hooks/useE2EEDemo';
import { Header } from './components/Header';
import { ParticipantGrid } from './components/ParticipantGrid';
import { EventLog } from './components/EventLog';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import './App.css';

const App = () => {
  const {
    callId,
    participants,
    events,
    loading,
    e2eeEnabled,
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
        onToggleE2EE={toggleE2EE}
        onAddParticipant={addParticipant}
        loading={loading}
      />
      <ParticipantGrid
        participants={participants}
        onRemove={removeParticipant}
        onToggleE2EE={toggleParticipantE2EE}
        onRotateKey={rotateKey}
        onSetKey={setKeyFromInput}
        onDismissError={dismissError}
      />
      <EventLog entries={events} />
    </div>
  );
};

export default App;
