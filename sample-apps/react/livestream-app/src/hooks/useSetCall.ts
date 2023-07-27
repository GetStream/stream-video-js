import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Call,
  CallingState,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { getURLCredentials } from '../utils/getURLCredentials';
import { DEFAULT_CALL_TYPE } from '../utils/constants';

export const useSetCall = (client?: StreamVideoClient) => {
  const { callId } = useParams<{ callId: string }>();
  const { type } = getURLCredentials();
  const [call, setCall] = useState<Call | undefined>(undefined);

  useEffect(() => {
    if (!(client && callId)) {
      return;
    }
    const _call = client.call(type ?? DEFAULT_CALL_TYPE, callId);
    setCall(_call);

    return () => {
      if (_call?.state.callingState !== CallingState.LEFT) {
        _call?.leave();
      }
      setCall(undefined);
    };
  }, [client, callId, type]);

  return call;
};
