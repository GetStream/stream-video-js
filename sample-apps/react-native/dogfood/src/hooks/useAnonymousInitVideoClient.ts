import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { useCallback, useEffect, useState } from 'react';
import { STREAM_API_KEY } from '../../config';
import { createToken } from '../modules/helpers/createToken';

type InitAnonymousVideoClientType = {
  callId?: string;
  callType?: string;
};

export const useAnonymousInitVideoClient = ({
  callId,
  callType,
}: InitAnonymousVideoClientType) => {
  const [client, setClient] = useState<StreamVideoClient>();

  const apiKey = STREAM_API_KEY;

  const tokenProvider = useCallback(async () => {
    const anonymousUser = {
      id: '!anon',
    };
    const token = await createToken({
      user_id: anonymousUser?.id,
      call_cids: `${callType}:${callId}`,
    });
    return token;
  }, [callId, callType]);

  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey,
      tokenProvider,
      user: { type: 'anonymous' },
    });
    setClient(_client);

    return () => {
      _client
        .disconnectUser()
        .catch((error) => console.error('Unable to disconnect user', error));
      setClient(undefined);
    };
  }, [apiKey, tokenProvider]);

  return client;
};
