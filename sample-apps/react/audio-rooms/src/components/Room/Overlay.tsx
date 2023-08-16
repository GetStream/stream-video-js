import {
  Avatar,
  CallingState,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { CloseInactiveRoomButton } from './RoomAccessControls';

export const EndedRoomOverlay = () => {
  return (
    <div className="room-overlay">
      <p>This room has been terminated</p>
      <CloseInactiveRoomButton>Back to overview</CloseInactiveRoomButton>
    </div>
  );
};

const CallingStateStatus: Record<string, string> = {
  [CallingState.RECONNECTING]: 'Trying to reconnect',
  [CallingState.RECONNECTING_FAILED]: 'Reconnect failed',
  [CallingState.OFFLINE]: 'You are offline',
  [CallingState.JOINING]: 'Joining the room...',
};

export const RoomLobby = () => {
  const call = useCall();
  const { useCallCallingState, useIsCallLive } = useCallStateHooks();
  const callingState = useCallCallingState();
  const isLive = useIsCallLive();

  if (!call) return null;

  if (Object.keys(CallingStateStatus).includes(callingState)) {
    return (
      <div className="room-overlay">
        <p>{CallingStateStatus[callingState]}</p>
      </div>
    );
  }

  return (
    <div className="room-overlay">
      {isLive ? <p>The room is live.</p> : <RoomIntro />}
      <button
        disabled={!isLive}
        className="room-access-controls-button"
        onClick={async () => {
          await call.join().catch((err) => {
            console.log(err);
          });
        }}
      >
        Join
      </button>
    </div>
  );
};

const RoomIntro = () => {
  const { useCallCustomData, useCallCreatedBy } = useCallStateHooks();
  const customData = useCallCustomData();
  const creator = useCallCreatedBy();
  const host = customData.hosts ? customData.hosts[0] : creator;
  const hostName = host?.name ?? host?.id ?? 'Host';
  return (
    <div className="room-intro">
      <div className="room-host">
        <Avatar
          className="host-avatar"
          name={hostName}
          imageSrc={host?.imageUrl}
        />
        <h3>{customData.title ?? hostName}</h3>
      </div>
      <p className="room-description">{customData.description}</p>
      <p>The room isn't live. Please wait until the host opens it.</p>
    </div>
  );
};
