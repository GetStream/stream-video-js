import {
  CallingState,
  CallControls,
  PaginatedGridLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import type { ParticipantState } from '../types';
import { KeyControls } from './KeyControls';
import './ParticipantPanel.css';

interface ParticipantPanelProps {
  participant: ParticipantState;
  onRemove: (userId: string) => void;
  onRotateKey: (userId: string, localOnly: boolean) => void;
  onSetKey: (userId: string, input: string, localOnly: boolean) => void;
}

const CallUI = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) {
    return <div className="participant-panel__loading">Connecting...</div>;
  }

  return (
    <StreamTheme>
      <PaginatedGridLayout />
      <CallControls />
    </StreamTheme>
  );
};

export const ParticipantPanel = ({
  participant,
  onRemove,
  onRotateKey,
  onSetKey,
}: ParticipantPanelProps) => {
  const { userId, name, color, client, call, currentKey, keyIndex } =
    participant;

  return (
    <div className="participant-panel" style={{ borderTopColor: color }}>
      <div className="participant-panel__header">
        <div className="participant-panel__identity">
          <span
            className="participant-panel__dot"
            style={{ backgroundColor: color }}
          />
          <span className="participant-panel__name">{name}</span>
          <span className="participant-panel__user-id" title={userId}>
            {userId.slice(0, 24)}...
          </span>
        </div>
        <button
          className="participant-panel__remove"
          onClick={() => onRemove(userId)}
          title="Remove participant"
        >
          &times;
        </button>
      </div>

      <div className="participant-panel__video">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <CallUI />
          </StreamCall>
        </StreamVideo>
        {participant.decryptionFailed && (
          <div className="participant-panel__toast">
            <span>⚠️ Decryption failed — key mismatch</span>
            <button
              className="participant-panel__toast-dismiss"
              onClick={() => participant.onDismissError?.()}
            >
              &times;
            </button>
          </div>
        )}
      </div>

      <KeyControls
        currentKey={currentKey}
        keyIndex={keyIndex}
        color={color}
        onRotate={(localOnly) => onRotateKey(userId, localOnly)}
        onSetKey={(input, localOnly) => onSetKey(userId, input, localOnly)}
      />
    </div>
  );
};
