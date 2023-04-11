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
      console.log(`activeCall: ${JSON.stringify(activeCall)}`);
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
  }, [currentRoom, getCall]);
  return (
    <>
      {call && (
        <StreamCallProvider call={call}>
          <RoomActive />
        </StreamCallProvider>
      )}
      {!call && <div>Loading</div>}
    </>
  );
}

export default RoomActiveContainer;
