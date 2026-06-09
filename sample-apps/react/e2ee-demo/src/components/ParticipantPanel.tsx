import { memo } from 'react';
import {
  CallingState,
  CallControls,
  PaginatedGridLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import type { HarnessParticipant } from '../harness/snapshot';
import { useHarnessEngine } from '../hooks/useHarness';
import { KeyControls } from './KeyControls';
import { StatusReadout } from './StatusReadout';
import { ChaosControls } from './ChaosControls';
import { SpyOverlay } from './SpyOverlay';
import { EventLog } from './EventLog';
import type { EventLogEntry } from './EventLog';
import './ParticipantPanel.css';

const CallUI = () => {
  const { useCallCallingState } = useCallStateHooks();
  if (useCallCallingState() !== CallingState.JOINED) {
    return <div className="participant-panel__loading">Connecting...</div>;
  }
  return (
    <StreamTheme>
      <PaginatedGridLayout />
      <CallControls />
    </StreamTheme>
  );
};

interface Props {
  participant: HarnessParticipant;
  nameByUserId: Record<string, string>;
  events: EventLogEntry[];
}

export const ParticipantPanel = memo(function ParticipantPanel({
  participant,
  nameByUserId,
  events,
}: Props) {
  const engine = useHarnessEngine();
  const {
    userId,
    name,
    color,
    role,
    client,
    call,
    currentKey,
    keyIndex,
    enabled,
  } = participant;
  const isSpy = role === 'spy';

  return (
    <div
      className={`participant-panel ${isSpy ? 'participant-panel--spy' : ''}`}
      style={{ borderTopColor: color }}
    >
      <div className="participant-panel__header">
        <div className="participant-panel__identity">
          <span
            className="participant-panel__dot"
            style={{ backgroundColor: color }}
          />
          <span className="participant-panel__name">{name}</span>
          {isSpy && (
            <span className="participant-panel__spy-badge">SPY · no key</span>
          )}
        </div>
        <div className="participant-panel__actions">
          {!isSpy && (
            <label
              className="participant-panel__e2ee-toggle"
              title="Toggle E2EE"
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => engine.setEnabled(userId, e.target.checked)}
              />
              E2EE
            </label>
          )}
          <button
            className="participant-panel__remove"
            onClick={() => engine.removeParticipant(userId)}
            title="Remove participant"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="participant-panel__video">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <CallUI />
          </StreamCall>
        </StreamVideo>
        {isSpy && <SpyOverlay />}
      </div>

      <StatusReadout participant={participant} nameByUserId={nameByUserId} />

      {!isSpy && currentKey && (
        <KeyControls
          currentKey={currentKey}
          keyIndex={keyIndex}
          color={color}
          onRotate={(localOnly) => engine.rotateKey(userId, localOnly)}
          onSetKey={(input, localOnly) =>
            engine.setKey(userId, input, localOnly)
          }
        />
      )}

      {!isSpy && <ChaosControls participant={participant} />}

      <EventLog entries={events} />
    </div>
  );
});
