import {
  Restricted,
  useCall,
  useCallCallingState,
  useCallMetadata,
} from '@stream-io/video-react-bindings';
import { CallingState, OwnCapability } from '@stream-io/video-client';
import { CloseInactiveRoomButton } from './CloseInactiveRoomButton';

export const RoomNavControls = () => {
  const call = useCall();
  const metadata = useCallMetadata();
  const callingState = useCallCallingState();

  if (!call || (callingState !== CallingState.JOINED && !metadata?.backstage))
    return null;

  return (
    <div className="room-nav-controls">
      {metadata?.backstage ? (
        <>
          <CloseInactiveRoomButton>Back to overview</CloseInactiveRoomButton>
          <Restricted
            requiredGrants={[OwnCapability.JOIN_BACKSTAGE]}
            hasPermissionsOnly
          >
            <button
              className="leave-button"
              onClick={async () => {
                call.goLive();
                call.join();
              }}
            >
              Go live!
            </button>
          </Restricted>
        </>
      ) : (
        <>
          <Restricted
            requiredGrants={[OwnCapability.END_CALL]}
            hasPermissionsOnly
          >
            <button className="leave-button" onClick={() => call.endCall()}>
              End room
            </button>
          </Restricted>
          <button className="leave-button" onClick={() => call.leave()}>
            Leave Quietly
          </button>
        </>
      )}
    </div>
  );
};
