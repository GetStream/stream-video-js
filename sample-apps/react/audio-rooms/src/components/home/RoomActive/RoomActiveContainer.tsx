import { StreamCallProvider } from '@stream-io/video-react-bindings';
import { useAudioRoomContext } from '../../../contexts/AudioRoomContext/AudioRoomContext';
import { useCallback, useEffect, useState } from 'react';
import RoomActive from '../RoomActive';
import { Call, CallingState } from '@stream-io/video-client';
import { MediaDevicesProvider } from '@stream-io/video-react-sdk';

function RoomActiveContainer() {
  const { currentRoom } = useAudioRoomContext();
  const [call, setCall] = useState<Call | undefined>(undefined);

  const getCall = useCallback(async (callToJoin: Call) => {
    const callingState = callToJoin.state.callingState;
    console.log(`getCall: current callingState: ${callingState}`);
    // We only want to join if the call is not in backstage, but live
    const isBackstage = callToJoin.state.metadata?.backstage;
    if (
      callingState !== CallingState.JOINED &&
      callingState !== CallingState.JOINING &&
      !isBackstage
    ) {
      await callToJoin.join();
      // const audioStream = await getAudioStream();
      // await callToJoin.publishAudioStream(audioStream);
    }

    // await callToJoin.endCall();
    // await callToJoin.muteAllUsers('audio');
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
        <MediaDevicesProvider
          initialAudioEnabled={false}
          initialVideoEnabled={false}
        >
          <StreamCallProvider call={call}>
            <RoomActive />
          </StreamCallProvider>
        </MediaDevicesProvider>
      )}
      {!call && <div className="active-room">Loading</div>}
    </>
  );
}

export default RoomActiveContainer;
