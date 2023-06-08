import { Call, CallingState } from '@stream-io/video-client';
import { useCallCallingState } from '@stream-io/video-react-bindings';
import { CloseInactiveRoomButton } from './CloseInactiveRoomButton';

export const EndedRoomOverlay = () => {
  return (
    <div className="room-overlay">
      <p>This room has been terminated</p>
      <CloseInactiveRoomButton>Close</CloseInactiveRoomButton>
    </div>
  );
};
export const RoomLobby = ({ call }: { call: Call }) => {
  const callingState = useCallCallingState();

  return (
    <div className="room-overlay">
      {callingState === CallingState.JOINING && <p>Joining the room...</p>}
      {callingState === CallingState.RECONNECTING && <p>Trying to reconnect</p>}
      {[CallingState.IDLE, CallingState.UNKNOWN, CallingState.LEFT].includes(
        callingState,
      ) && <p>The room is live</p>}
      {callingState === CallingState.OFFLINE && <p>You are offline</p>}
      <button className="leave-button" onClick={() => call.join()}>
        Join
      </button>
    </div>
  );
};
