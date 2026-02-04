import { useEffect, useState } from 'react';
import { Call, CallingState, StreamVideoClient } from '@stream-io/video-client';

export interface UseInitializeCallProps {
  client?: StreamVideoClient;
  callType: string;
  callId: string;
  onError?: (error: Error) => void;
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

    const _call = client.call(callType, callId);

    _call
      .get()
      .then(() => setCall(_call))
      .catch((error: Error) => {
        console.error('Failed to initialize call:', error);
        onError?.(error);
      });

    return () => {
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
