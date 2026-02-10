import { useEffect, useState } from 'react';
import { Call, CallingState, StreamVideoClient } from '@stream-io/video-client';
import { useEffectEvent } from '@stream-io/video-react-bindings';

export interface UseInitializeCallProps {
  client?: StreamVideoClient;
  callType: string;
  callId: string;
  onError?: (error: any) => void;
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
  const handleError = useEffectEvent(onError ?? (() => {}));

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
        handleError(err);
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
  }, [client, callType, callId]);

  return call;
};
