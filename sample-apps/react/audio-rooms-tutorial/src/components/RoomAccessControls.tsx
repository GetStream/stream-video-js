import {
  CallingState,
  OwnCapability,
  Restricted,
  useCall,
  useCallCallingState,
  useCallMetadata,
  useIsCallLive,
  useMediaDevices,
} from '@stream-io/video-react-sdk';

export const RoomAccessControls = () => {
  const { setInitialAudioEnabled } = useMediaDevices();
  const call = useCall();
  const metadata = useCallMetadata();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();

  if (
    !call ||
    // The controls will not be shown. Instead, a lobby overlay will be presented.
    (callingState !== CallingState.JOINED && isLive) ||
    !!metadata?.ended_at
  )
    return null;

  const canJoin = ![
    CallingState.JOINING,
    CallingState.JOINED,
    CallingState.LEFT,
  ].includes(callingState);
  return (
    <div className="room-access-controls">
      {!isLive ? (
        <Restricted
          requiredGrants={[OwnCapability.JOIN_BACKSTAGE]}
          hasPermissionsOnly
        >
          <button
            className="room-access-controls-button"
            onClick={async () => {
              await call.goLive();
              if (canJoin) await call.join();
            }}
          >
            Go live{canJoin ? ' and join' : ''}!
          </button>
        </Restricted>
      ) : (
        <>
          <Restricted
            requiredGrants={[OwnCapability.END_CALL]}
            hasPermissionsOnly
          >
            <button
              className="room-access-controls-button"
              onClick={async () => {
                await call.stopLive();
                await call?.leave();
              }}
            >
              Stop room
            </button>
          </Restricted>
          <button
            className="room-access-controls-button"
            onClick={async () => {
              await call.leave().catch((err) => {
                console.error('Error leaving call', err);
              });
              setInitialAudioEnabled(false);
            }}
          >
            Leave Quietly
          </button>
        </>
      )}
    </div>
  );
};
