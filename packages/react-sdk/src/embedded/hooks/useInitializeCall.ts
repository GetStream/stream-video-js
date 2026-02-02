import { useEffect, useRef, useState } from 'react';
import { Call, StreamVideoClient } from '@stream-io/video-client';

export interface UseInitializeCallProps {
  client?: StreamVideoClient;
  callType: string;
  callId: string;
  onError?: (error: Error) => void;
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
}: UseInitializeCallProps): Call | undefined => {
  const [call, setCall] = useState<Call>();
  const initRef = useRef(false);

  useEffect(() => {
    if (!client || !callId) return;

    if (initRef.current) return;
    initRef.current = true;

    const _call = client.call(callType, callId);

    _call
      .get()
      .then(() => {
        setCall(_call);
      })
      .catch((error: Error) => {
        console.error('Failed to get or create call:', error);
        onError?.(error);
      });

    return () => {
      initRef.current = false;
      setCall(undefined);
      _call.leave().catch((err) => console.error('Failed to leave call:', err));
    };
  }, [client, callType, callId, onError]);

  return call;
};
