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
          // @ts-expect-error
          // FIXME OL: imageURL doesn't exist on User anymore
          imageSrc={localUser && localUser['imageUrl']}
        />
      </div>

      <div className="rmc__primary-participant-wrapper">
        <ParticipantPlaceholder
          className="rmc__primary-participant-placeholder"
          // @ts-expect-error
          // FIXME OL: imageURL doesn't exist on User anymore
          imageSrc={remoteUser && remoteUser['imageUrl']}
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
