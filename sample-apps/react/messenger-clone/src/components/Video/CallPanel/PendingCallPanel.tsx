import { ParticipantPlaceholder } from './ParticipantPlaceholder';
import { IncomingCallControls, OutgoingCallControls } from './CallControls';
import { CallMetadata, User } from '@stream-io/video-client';

type OutgoingCallPanelProps = {
  incomingCall?: CallMetadata;
  outgoingCall?: CallMetadata;
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
        <OutgoingCallControls callCid={outgoingCall.call.cid} />
      )}
      {incomingCall && !outgoingCall && (
        <IncomingCallControls callCid={incomingCall.call.cid} />
      )}
    </div>
  </div>
);
