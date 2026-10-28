import { StreamVideoClient, User } from '@stream-io/video-react-sdk';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { getUser } from '../utils/getUser';
import { getURLCredentials } from '../utils/getURLCredentials';
import { useParams } from 'react-router';
import { DEFAULT_CALL_TYPE } from '../utils/constants';

const envApiKey = import.meta.env.VITE_STREAM_API_KEY as string | undefined;
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
  const explicitApiKey = api_key ?? envApiKey;

  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    // Targets the explicit API key when one is configured, otherwise the
    // token endpoint's demo environment (whose API key it returns).
    const createEndpoint = () => {
      const endpoint = new URL(tokenProviderUrl);
      if (explicitApiKey) {
        endpoint.searchParams.set('api_key', explicitApiKey);
      } else {
        endpoint.searchParams.set('environment', 'demo');
      }
      return endpoint;
    };
    const resolveApiKey = async () => {
      if (explicitApiKey) return explicitApiKey;
      const response = await fetch(createEndpoint()).then((res) => res.json());
      return response.apiKey as string;
    };
    const tokenProvider = async () => {
      const endpoint = createEndpoint();
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

    let _client: StreamVideoClient | undefined;
    let cancelled = false;
    resolveApiKey()
      .then((apiKey) => {
        if (cancelled) return;
        _client =
          user.type === 'anonymous' || user.type === 'guest'
            ? new StreamVideoClient({ apiKey, user })
            : new StreamVideoClient({
                apiKey,
                user,
                ...(token ? { token, tokenProvider } : { tokenProvider }),
              });
        setClient(_client);
      })
      .catch((error) => console.error(`Unable to resolve the API key`, error));

    return () => {
      cancelled = true;
      _client
        ?.disconnectUser()
        .catch((error) => console.error(`Unable to disconnect user`, error));
      setClient(undefined);
    };
  }, [explicitApiKey, callId, token, type, user]);

  return client;
};
