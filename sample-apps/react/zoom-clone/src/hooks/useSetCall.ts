import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { DEFAULT_CALL_TYPE, getURLCredentials } from '../utils';

export const useSetCall = () => {
  const { callId } = useParams();
  const client = useStreamVideoClient();
  const { type: callTypeUrl } = getURLCredentials();
  const [call, setCall] = useState<Call | undefined>(undefined);

  useEffect(() => {
    if (!callId || !client) {
      return;
    }
    const callToSet = client.call(callTypeUrl ?? DEFAULT_CALL_TYPE, callId);
    callToSet.getOrCreate().then(() => setCall(callToSet));
  }, [callTypeUrl, client, callId]);

  return call;
};
