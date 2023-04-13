import { StreamCallProvider } from '@stream-io/video-react-bindings';
import { useAudioRoomContext } from '../../../contexts/AudioRoomContext/AudioRoomContext';
import { useCallback, useEffect, useState } from 'react';
import RoomActive from '../RoomActive';
import { Call } from '@stream-io/video-client';

function RoomActiveContainer() {
  const { currentRoom } = useAudioRoomContext();
  const [call, setCall] = useState<Call | undefined>(undefined);

  const getCall = useCallback(async (callToJoin: Call) => {
    console.log('getCall');
    // await callToJoin.goLive();
    await callToJoin.join();
    setCall(callToJoin);
  }, []);

  useEffect(() => {
    if (currentRoom?.call) {
      getCall(currentRoom.call);
    }

    return () => {
      console.log('Leaving call.');
      call?.leave();
    };
  }, [currentRoom, getCall, call]);
  return (
    <>
      {call && (
        <StreamCallProvider call={call}>
          <RoomActive />
        </StreamCallProvider>
      )}
      {!call && <div className="active-room">Loading</div>}
    </>
  );
}

export default RoomActiveContainer;
