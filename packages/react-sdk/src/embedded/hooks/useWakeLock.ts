import { useEffect } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

/**
 * Hook to prevent screen from going to sleep during active calls.
 * Uses the Screen Wake Lock API when available.
 */
export const useWakeLock = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callState = useCallCallingState();

  useEffect(() => {
    if (callState !== CallingState.JOINED || !('wakeLock' in navigator)) return;

    let interrupted = false;
    let wakeLockSentinel: null | WakeLockSentinel = null;
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
