import {
  Avatar,
  CallingState,
  useCall,
  useCallCallingState, useCallMetadata,
  useIsCallLive,
} from '@stream-io/video-react-sdk';

export const EndedRoomOverlay = () => {
  return (
    <div className="room-overlay">
      <p>This room has been terminated</p>
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
      {isLive ? <p>The room is live.</p> : <RoomIntro/>}
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
  const metaData = useCallMetadata();
  const host = metaData?.custom.hosts[0];
  const hostName = host?.name ?? host?.id ?? 'Host';
  return (
    <div className="room-intro">
      <div className="room-host">
        <Avatar className="host-avatar" name={hostName} imageSrc={host?.imageUrl} />
        <h3>{hostName}</h3>
      </div>
      <p className="room-description">{metaData?.custom.description}</p>
      <p>The room isn't live. Please wait until the host opens it.</p>
    </div>
  );
}
