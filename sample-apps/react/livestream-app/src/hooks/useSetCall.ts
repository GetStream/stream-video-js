import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Call, StreamVideoClient } from '@stream-io/video-react-sdk';
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
    setCall(client.call(type ?? DEFAULT_CALL_TYPE, callId));
  }, [client, callId, type]);

  return call;
};
