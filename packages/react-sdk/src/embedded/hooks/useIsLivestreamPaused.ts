import { useEffect, useState } from 'react';
import { CallingState, SfuModels } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

/**
 * Distinguishes a temporary live pause (host went backstage) from a real
 * call end. Returns `true` when the viewer was kicked because the host
 * paused the livestream — not because the call was fully terminated.
 *
 * Resets to `false` on rejoin or when `call.ended` (real end) arrives.
 */
export const useIsLivestreamPaused = () => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!call) return;

    const unsubSfu = call.on('callEnded', (e) => {
      if (e.reason === SfuModels.CallEndedReason.LIVE_ENDED) {
        setIsPaused(true);
      }
    });

    const unsubEnded = call.on('call.ended', () => {
      setIsPaused(false);
    });

    return () => {
      unsubSfu();
      unsubEnded();
    };
  }, [call]);

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      setIsPaused(false);
    }
  }, [callingState]);

  return isPaused;
};
