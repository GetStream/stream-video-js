import { StreamCallProvider } from '@stream-io/video-react-bindings';
import { useAudioRoomContext } from '../../../contexts/AudioRoomContext/AudioRoomContext';
import { useCallback, useEffect, useState } from 'react';
import RoomActive from '../RoomActive';
import { Call, CallingState, getAudioStream } from '@stream-io/video-client';
import { useUserContext } from '../../../contexts/UserContext/UserContext';

function RoomActiveContainer() {
  const { user } = useUserContext();
  const { currentRoom } = useAudioRoomContext();
  const [call, setCall] = useState<Call | undefined>(undefined);

  const getCall = useCallback(async (callToJoin: Call) => {
    console.log('getCall');
    const callingState = call?.state.callingState;
    if (
      callingState !== CallingState.JOINED &&
      callingState !== CallingState.JOINING
    ) {
      await callToJoin.join();
      const audioStream = await getAudioStream();
      await callToJoin.publishAudioStream(audioStream);
    }

    // await callToJoin.goLive();
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
