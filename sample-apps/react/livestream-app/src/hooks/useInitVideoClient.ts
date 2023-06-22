import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { PropsWithChildren, useMemo, useState } from 'react';
import { getUser } from '../utils/getUser';
import { getURLCredentials } from '../utils/getURLCredentials';

const envApiKey = import.meta.env.VITE_STREAM_API_KEY as string;
const tokenProviderUrl = import.meta.env.VITE_TOKEN_PROVIDER_URL as string;

type VideoClientProviderProps = {
  call_cids?: string;
  isAnon?: boolean;
  role?: string;
};

export const useInitVideoClient = ({
  call_cids,
  isAnon,
  role,
}: PropsWithChildren<VideoClientProviderProps>) => {
  const { api_key, token } = getURLCredentials();
  const user = useMemo(getUser, []);
  const apiKey = api_key ?? envApiKey;

  const [client] = useState<StreamVideoClient>(() => {
    const tokenProvider = async () => {
      const endpoint = new URL(tokenProviderUrl);
      endpoint.searchParams.set('api_key', apiKey);
      endpoint.searchParams.set('user_id', isAnon ? '!anon' : user.id);

      if (call_cids) {
        endpoint.searchParams.set('call_cids', call_cids);
      }
      const response = await fetch(endpoint).then((res) => res.json());
      return response.token as string;
    };
    return new StreamVideoClient({
      apiKey,
      tokenProvider,
      token,
      user: isAnon ? { type: 'anonymous' } : role ? { ...user, role } : user,
    });
  });

  return client;
};
