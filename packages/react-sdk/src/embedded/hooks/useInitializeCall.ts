import { useEffect, useState } from 'react';
import { Call, CallingState, StreamVideoClient } from '@stream-io/video-client';
import type { EmbeddedErrorType } from '../types';

export interface UseInitializeCallProps {
  client?: StreamVideoClient;
  callType: string;
  callId: string;
  onError: (error: any, type: EmbeddedErrorType) => void;
}

/**
 * Hook to initialize and manage a Call instance.
 */
export const useInitializeCall = ({
  client,
  callType,
  callId,
  onError,
}: UseInitializeCallProps): Call | undefined => {
  const [call, setCall] = useState<Call>();

  useEffect(() => {
    if (!client || !callId) return;

    let cancelled = false;
    const _call = client.call(callType, callId);

    _call
      .get()
      .then(() => {
        if (!cancelled) setCall(_call);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error('Failed to initialize call:', err);
        onError(err, 'call');
      });

    return () => {
      cancelled = true;
      setCall(undefined);
      if (_call.state.callingState === CallingState.JOINED) {
        _call
          .leave()
          .catch((err) => console.error('Failed to leave call:', err));
      }
    };
  }, [client, callType, callId, onError]);

  return call;
};
