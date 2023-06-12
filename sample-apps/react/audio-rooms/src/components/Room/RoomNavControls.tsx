import {
  CallingState,
  OwnCapability,
  Restricted,
  useCall,
  useCallCallingState,
  useIsCallLive,
} from '@stream-io/video-react-sdk';
import { CloseInactiveRoomButton } from './CloseInactiveRoomButton';
import { LeaveIcon } from '../icons';

export const RoomNavControls = () => {
  const call = useCall();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();

  if (!call || (callingState !== CallingState.JOINED && !isLive)) return null;

  return (
    <div className="room-nav-controls">
      {!isLive ? (
        <>
          <CloseInactiveRoomButton>Back to overview</CloseInactiveRoomButton>
          <Restricted
            requiredGrants={[OwnCapability.JOIN_BACKSTAGE]}
            hasPermissionsOnly
          >
            <button
              className="leave-button"
              onClick={async () => {
                await call.goLive();
                await call.join();
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
            <button
              className="leave-button"
              onClick={async () => {
                await call.stopLive();
                await call.endCall();
              }}
            >
              <LeaveIcon />
              End room
            </button>
          </Restricted>
          <button className="leave-button" onClick={() => call.leave()}>
            <LeaveIcon />
            Leave Quietly
          </button>
        </>
      )}
    </div>
  );
};
