import { CallingState, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useEffect } from 'react';

interface WakeLockSentinel {
  release(): Promise<void>;
}

export const useWakeLock = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callState = useCallCallingState();

  useEffect(() => {
    if (callState !== CallingState.JOINED || !('wakeLock' in navigator)) return;

    let interrupted = false;
    let wakeLockSentinel: null | WakeLockSentinel = null;
    // @ts-expect-error
    navigator.wakeLock
      .request('screen')
      .then((wls: WakeLockSentinel) => {
        if (interrupted) return wls.release();
        wakeLockSentinel = wls;
      })
      .catch((error: unknown) =>
        console.log(`Couldn't setup WakeLock due to: ${error}`),
      );

    return () => {
      interrupted = true;
      wakeLockSentinel?.release();
    };
  }, [callState]);
};
