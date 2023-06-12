import {
  CallingState,
  useCall,
  useCallCallingState,
  useIsCallLive,
} from '@stream-io/video-react-sdk';
import { CloseInactiveRoomButton } from './CloseInactiveRoomButton';

export const EndedRoomOverlay = () => {
  return (
    <div className="room-overlay">
      <p>This room has been terminated</p>
      <CloseInactiveRoomButton>Close</CloseInactiveRoomButton>
    </div>
  );
};

export const RoomLobby = () => {
  const call = useCall();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();

  return (
    <div className="room-overlay">
      {isLive && <p>The room is live</p>}
      {!isLive && (
        <p>The room isn't live yet. Please wait until the host opens it.</p>
      )}
      {callingState === CallingState.JOINING && <p>Joining the room...</p>}
      {callingState === CallingState.RECONNECTING && <p>Trying to reconnect</p>}
      {callingState === CallingState.OFFLINE && <p>You are offline</p>}
      <button
        disabled={!isLive}
        className="leave-button"
        onClick={() => call?.join()}
      >
        Join
      </button>
    </div>
  );
};
