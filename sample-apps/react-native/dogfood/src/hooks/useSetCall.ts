import { useEffect, useState } from 'react';
import {
  Call,
  CallingState,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';

export const useSetCall = (
  callId: string,
  callType: string,
  client?: StreamVideoClient,
) => {
  const [call, setCall] = useState<Call | undefined>(undefined);

  useEffect(() => {
    if (!(client && callId)) {
      return;
    }
    const _call = client.call(callType, callId);
    setCall(_call);

    return () => {
      if (_call?.state.callingState !== CallingState.LEFT) {
        _call?.leave();
      }
      setCall(undefined);
    };
  }, [client, callId, callType]);

  return call;
};
