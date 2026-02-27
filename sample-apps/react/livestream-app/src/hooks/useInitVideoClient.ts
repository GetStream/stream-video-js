import { StreamVideoClient, User } from '@stream-io/video-react-sdk';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { getUser } from '../utils/getUser';
import { getURLCredentials } from '../utils/getURLCredentials';
import { useParams } from 'react-router-dom';
import { DEFAULT_CALL_TYPE } from '../utils/constants';

const envApiKey =
  (import.meta.env.VITE_STREAM_API_KEY as string | undefined) || 'mmhfdzb5evj2';
const tokenProviderUrl =
  (import.meta.env.VITE_TOKEN_PROVIDER_URL as string | undefined) ||
  'https://pronto.getstream.io/api/auth/create-token';

type VideoClientProviderProps = {
  isAnon?: boolean;
};

export const useInitVideoClient = ({
  isAnon,
}: PropsWithChildren<VideoClientProviderProps>) => {
  const { callId } = useParams<{ callId: string }>();
  const { api_key, token, type } = getURLCredentials();
  const user = useMemo<User>(() => {
    return isAnon ? { type: 'anonymous' } : getUser();
  }, [isAnon]);
  const apiKey = api_key ?? envApiKey;

  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    const tokenProvider = async () => {
      const endpoint = new URL(tokenProviderUrl);
      endpoint.searchParams.set('api_key', apiKey);
      endpoint.searchParams.set(
        'user_id',
        user.type === 'anonymous' ? '!anon' : user.id!,
      );

      if (user.type === 'anonymous') {
        endpoint.searchParams.set(
          'call_cids',
          `${type ?? DEFAULT_CALL_TYPE}:${callId}`,
        );
      }
      const response = await fetch(endpoint).then((res) => res.json());
      return response.token as string;
    };
    const _client =
      user.type === 'anonymous' || user.type === 'guest'
        ? new StreamVideoClient({ apiKey, user })
        : new StreamVideoClient({
            apiKey,
            user,
            ...(token ? { token, tokenProvider } : { tokenProvider }),
          });
    setClient(_client);

    return () => {
      _client
        .disconnectUser()
        .catch((error) => console.error(`Unable to disconnect user`, error));
      setClient(undefined);
    };
  }, [apiKey, callId, token, type, user]);

  return client;
};
