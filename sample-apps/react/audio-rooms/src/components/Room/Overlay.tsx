import {
  CallingState,
  useCall,
  useCallCallingState,
  useIsCallLive,
  useMediaDevices,
} from '@stream-io/video-react-sdk';
import { useJoinedCall } from '../../contexts';
import { CloseInactiveRoomButton } from './RoomAccessControls';

export const EndedRoomOverlay = () => {
  return (
    <div className="room-overlay">
      <p>This room has been terminated</p>
      <CloseInactiveRoomButton>Back to overview</CloseInactiveRoomButton>
    </div>
  );
};

export const RoomLobby = () => {
  const { joinedCall, setJoinedCall } = useJoinedCall();
  const { setInitialAudioEnabled } = useMediaDevices();
  const call = useCall();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();

  if (!call) return null;

  return (
    <div className="room-overlay">
      {isLive && <p>The room is live.</p>}
      {!isLive && (
        <p>The room isn't live yet. Please wait until the host opens it.</p>
      )}
      {joinedCall && joinedCall.cid !== call.cid && (
        <>
          <div>
            You are already connected to another room:{' '}
            {joinedCall.data?.custom.title}
          </div>
          <div>
            If you join this one, you will silently leave the other one.
          </div>
        </>
      )}
      {callingState === CallingState.JOINING && <p>Joining the room...</p>}
      {callingState === CallingState.RECONNECTING && <p>Trying to reconnect</p>}
      {callingState === CallingState.OFFLINE && <p>You are offline</p>}
      {joinedCall?.cid !== call.cid && (
        <button
          disabled={!isLive}
          className="room-access-controls-button"
          onClick={async () => {
            if (joinedCall) {
              await joinedCall.leave().catch((err) => {
                console.log(err);
              });
              setInitialAudioEnabled(false);
            }
            await call.join().catch((err) => {
              console.log(err);
            });
            setJoinedCall(call);
          }}
        >
          Join
        </button>
      )}
    </div>
  );
};
