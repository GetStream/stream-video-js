import { ParticipantPlaceholder } from './ParticipantPlaceholder';
import { IncomingCallControls, OutgoingCallControls } from './CallControls';
import { PendingCall, User } from '@stream-io/video-client';

type OutgoingCallPanelProps = {
  incomingCall?: PendingCall;
  outgoingCall?: PendingCall;
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
          // FIXME OL: imageURL doesn't exist on User anymore
          imageSrc={localUser['imageUrl']}
        />
      </div>

      <div className="rmc__primary-participant-wrapper">
        <ParticipantPlaceholder
          className="rmc__primary-participant-placeholder"
          // FIXME OL: imageURL doesn't exist on User anymore
          imageSrc={remoteUser['imageUrl']}
        />
      </div>

      {outgoingCall && !incomingCall && (
        <OutgoingCallControls callCid={outgoingCall.call.callCid} />
      )}
      {incomingCall && !outgoingCall && (
        <IncomingCallControls callCid={incomingCall.call.callCid} />
      )}
    </div>
  </div>
);
