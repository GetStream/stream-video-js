import { RefObject, useEffect, useState } from 'react';
import { Call, StreamVideoClient } from '@stream-io/video-client';

export interface UseInitializeCallProps {
  client?: StreamVideoClient;
  callType: string;
  callId: string;
  onError?: (error: Error) => void;
  autoJoin: RefObject<boolean>;
}

/**
 * Hook to initialize and manage a Call instance.
 * Gets or creates the call and handles cleanup on unmount.
 */
export const useInitializeCall = ({
  client,
  callType,
  callId,
  onError,
  autoJoin,
}: UseInitializeCallProps): Call | undefined => {
  const [call, setCall] = useState<Call>();

  useEffect(() => {
    if (!client || !callId) return;

    const _call = client.call(callType, callId);

    const action = autoJoin.current ? _call.join() : _call.get();

    action
      .then(() => setCall(_call))
      .catch((error: Error) => {
        console.error('Failed to initialize call:', error);
        onError?.(error);
      });
    return () => {
      setCall(undefined);
      _call.leave().catch((err) => console.error('Failed to leave call:', err));
    };
  }, [client, callType, callId, onError, autoJoin]);

  return call;
};
