import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { getUser } from '../utils/getUser';
import { getURLCredentials } from '../utils/getURLCredentials';
import { useParams } from 'react-router-dom';
import { DEFAULT_CALL_TYPE } from '../utils/constants';

const envApiKey = import.meta.env.VITE_STREAM_API_KEY as string;
const tokenProviderUrl = import.meta.env.VITE_TOKEN_PROVIDER_URL as string;

type VideoClientProviderProps = {
  isAnon?: boolean;
  role?: string;
};

export const useInitVideoClient = ({
  isAnon,
  role,
}: PropsWithChildren<VideoClientProviderProps>) => {
  const { callId } = useParams<{ callId: string }>();
  const { api_key, token, type } = getURLCredentials();
  const user = useMemo(() => {
    if (isAnon) {
      return { id: '!anon' };
    }
    return getUser();
  }, [isAnon]);
  const apiKey = api_key ?? envApiKey;

  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    const tokenProvider = async () => {
      const endpoint = new URL(tokenProviderUrl);
      endpoint.searchParams.set('api_key', apiKey);
      endpoint.searchParams.set('user_id', isAnon ? '!anon' : user.id);

      if (isAnon) {
        endpoint.searchParams.set(
          'call_cids',
          `${type ?? DEFAULT_CALL_TYPE}:${callId}`,
        );
      }
      const response = await fetch(endpoint).then((res) => res.json());
      return response.token as string;
    };
    const _client = new StreamVideoClient({
      apiKey,
      ...((isAnon || !token) && { tokenProvider }),
      ...(!isAnon && { token }),
      user: isAnon ? { type: 'anonymous' } : role ? { ...user, role } : user,
    });
    setClient(_client);

    return () => {
      _client
        .disconnectUser()
        .catch((error) => console.error(`Unable to disconnect user`, error));
      setClient(undefined);
    };
  }, []);

  return client;
};
