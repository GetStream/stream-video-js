import { useEffect, useRef, useState } from 'react';
import { Call, StreamVideoClient } from '@stream-io/video-react-sdk';

export type UseInitializeCallProps = {
  client?: StreamVideoClient;
  callType: string;
  callId?: string;
};

export const useInitializeCall = ({
  client,
  callType,
  callId,
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
      .catch((err) => {
        console.error('Failed to get call', err);
      });

    return () => {
      initRef.current = false;
      setCall(undefined);
      _call.leave().catch((err) => console.error('Failed to leave call', err));
    };
  }, [client, callType, callId]);

  return call;
};
