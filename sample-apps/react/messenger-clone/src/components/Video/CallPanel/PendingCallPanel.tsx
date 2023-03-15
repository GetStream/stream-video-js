import { ParticipantPlaceholder } from './ParticipantPlaceholder';
import { IncomingCallControls, OutgoingCallControls } from './CallControls';
import { Call, User } from '@stream-io/video-react-sdk';

type OutgoingCallPanelProps = {
  incomingCall?: Call;
  outgoingCall?: Call;
  localUser?: User;
  remoteUser?: User;
};

export const PendingCallPanel = ({
  incomingCall,
  outgoingCall,
  localUser,
  remoteUser,
}: OutgoingCallPanelProps) => (
  <div className="rmc__call-panel-backdrop">
    <div className="rmc__call-panel">
      <div className="rmc__secondary-participant-wrapper">
        <ParticipantPlaceholder
          className="rmc__secondary-participant-placeholder"
          imageSrc={localUser?.image}
        />
      </div>

      <div className="rmc__primary-participant-wrapper">
        <ParticipantPlaceholder
          className="rmc__primary-participant-placeholder"
          imageSrc={remoteUser?.image}
        />
      </div>

      {outgoingCall && !incomingCall && (
        <OutgoingCallControls
          callId={outgoingCall.id}
          callType={outgoingCall.type}
        />
      )}
      {incomingCall && !outgoingCall && (
        <IncomingCallControls
          callId={incomingCall.id}
          callType={incomingCall.type}
        />
      )}
    </div>
  </div>
);
