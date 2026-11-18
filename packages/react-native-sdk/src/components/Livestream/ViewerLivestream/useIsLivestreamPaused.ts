import { useEffect, useState } from 'react';
import { CallingState, SfuModels } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

/**
 * Returns `true` when Stop Live took the viewer out of the call, as opposed
 * to the call ending or the viewer leaving on their own.
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
    setIsPaused(false);

    const unsubSfu = call.on('callEnded', (e) => {
      if (e.reason === SfuModels.CallEndedReason.LIVE_ENDED) {
        setIsPaused(true);
      }
    });

    const unsubError = call.on('error', (e) => {
      if (e.error?.code === SfuModels.ErrorCode.LIVE_ENDED) {
        setIsPaused(true);
      }
    });

    const unsubEnded = call.on('call.ended', () => {
      setIsPaused(false);
    });

    return () => {
      unsubSfu();
      unsubError();
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
