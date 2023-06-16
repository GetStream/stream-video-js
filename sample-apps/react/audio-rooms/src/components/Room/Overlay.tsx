import {
  CallingState,
  useCall,
  useCallCallingState,
  useIsCallLive,
} from '@stream-io/video-react-sdk';
import { CloseInactiveRoomButton } from './CloseInactiveRoomButton';
import { useJoinedCall } from '../../contexts';

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
  const call = useCall();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();

  return (
    <div className="room-overlay">
      {isLive && <p>The room is live.</p>}
      {!isLive && (
        <p>The room isn't live yet. Please wait until the host opens it.</p>
      )}
      {joinedCall && (
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
      <button
        disabled={!isLive}
        className="leave-button"
        onClick={async () => {
          if (joinedCall) {
            await joinedCall.leave().catch((err) => {
              console.log(err);
            });
          }
          await call?.join().catch((err) => {
            console.log(err);
          });
          setJoinedCall(call);
        }}
      >
        Join
      </button>
    </div>
  );
};
