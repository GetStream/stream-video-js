import {
  CallingState,
  OwnCapability,
  Restricted,
  useCall,
  useCallCallingState,
  useIsCallLive,
} from '@stream-io/video-react-sdk';
import { CloseInactiveRoomButton } from './CloseInactiveRoomButton';
import { useLoadedCalls } from '../../contexts';

export const RoomNavControls = () => {
  const { setJoinedCall, joinedCall } = useLoadedCalls();
  const call = useCall();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();

  if (!call || (callingState !== CallingState.JOINED && isLive)) return null;

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
                if (joinedCall) {
                  await joinedCall.leave().catch((err) => {
                    console.error('Error leaving call', err);
                  });
                }
                await call.goLive();
                await call.join();
                setJoinedCall(call);
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
                setJoinedCall(undefined);
              }}
            >
              End room
            </button>
          </Restricted>
          <button
            className="leave-button"
            onClick={async () => {
              await call.leave().catch((err) => {
                console.error('Error leaving call', err);
              });
              setJoinedCall(undefined);
            }}
          >
            Leave Quietly
          </button>
        </>
      )}
    </div>
  );
};
