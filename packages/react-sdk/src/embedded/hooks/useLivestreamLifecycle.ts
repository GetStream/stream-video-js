import { useEffect, useState } from 'react';
import { CallingState } from '@stream-io/video-client';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

const SFU_CALL_ENDED_REASON_LIVE_ENDED = 2;

type LivestreamStatus = 'idle' | 'ended' | 'active';

/**
 * Tracks livestream lifecycle events to distinguish between
 * a temporary live stop (host went to backstage) and a real call end.
 *
 * After `call.leave()`, the internal state hooks (e.g. `useIsCallLive`)
 * stop updating because the `'all'` event handler is removed.
 * This hook uses raw coordinator/SFU events which remain active
 * on the StreamClient WS connection.
 *
 * Status transitions: `idle` → `ended` → `restarted` → `idle` (on rejoin)
 */
export const useLivestreamLifecycle = () => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [status, setStatus] = useState<LivestreamStatus>('idle');

  useEffect(() => {
    if (!call) return;

    const unsubscribeSfuEnded = call.on('callEnded', (e) => {
      if (e.reason === SFU_CALL_ENDED_REASON_LIVE_ENDED) {
        setStatus('ended');
      }
    });

    const unsubscribeLiveStarted = call.on('call.live_started', () => {
      setStatus((prev) => (prev === 'ended' ? 'active' : prev));
    });

    const unsubscribeCallEnded = call.on('call.ended', () => {
      setStatus('idle');
    });
    return () => {
      unsubscribeSfuEnded();
      unsubscribeLiveStarted();
      unsubscribeCallEnded();
    };
  }, [call]);

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      setStatus('idle');
    }
  }, [callingState]);

  return status;
};
