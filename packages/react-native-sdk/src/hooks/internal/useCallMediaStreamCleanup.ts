import { MediaStream } from '@stream-io/react-native-webrtc';
import { CallingState, disposeOfMediaStream } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';
import { useEffect, useRef } from 'react';

/**
 * This hook is meant to be used in Lobby view or equivalent.
 * It will cleanup the media stream on unmount if call is not meant to be joined.
 */
export const useCallMediaStreamCleanup = () => {
  const call = useCall();
  // keeping a reference of call to handle cleanup media stream only on unmount
  const callRef = useRef(call);
  callRef.current = call;

  useEffect(() => {
    return () => {
      const mediaStream = callRef.current?.camera.state.mediaStream as
        | MediaStream
        | undefined;
      if (
        mediaStream &&
        !(
          callRef.current?.state.callingState === CallingState.JOINED ||
          callRef.current?.state.callingState === CallingState.JOINING
        )
      ) {
        // we cleanup media stream only if call is not joined or joining
        disposeOfMediaStream(mediaStream);
      }
    };
  }, []);
};
