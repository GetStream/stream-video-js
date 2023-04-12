import {
  StreamCallProvider,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import { useAudioRoomContext } from '../../../contexts/AudioRoomContext/AudioRoomContext';
import { useCallback, useEffect, useState } from 'react';
import RoomActive from '../RoomActive';
import { Call } from '@stream-io/video-client';

function RoomActiveContainer() {
  const { currentRoom } = useAudioRoomContext();
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call | undefined>(undefined);

  const getCall = useCallback(
    async (id: string) => {
      const activeCall = await client?.joinCall(id, 'default');
      if (activeCall) {
        setCall(activeCall);
      }
    },
    [client],
  );

  useEffect(() => {
    if (currentRoom?.id) {
      getCall(currentRoom?.id);
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
