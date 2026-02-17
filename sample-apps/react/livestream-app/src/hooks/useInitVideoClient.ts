import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { getUser } from '../utils/getUser';
import { getURLCredentials } from '../utils/getURLCredentials';
import { useParams } from 'react-router-dom';

const envApiKey =
  (import.meta.env.VITE_STREAM_API_KEY as string | undefined) || 'chmxrgmgrjb5';

type VideoClientProviderProps = {
  isAnon?: boolean;
};

export const useInitVideoClient = ({
  isAnon,
}: PropsWithChildren<VideoClientProviderProps>) => {
  const { callId } = useParams<{ callId: string }>();
  const { api_key, type } = getURLCredentials();
  const user = useMemo(() => {
    if (isAnon) {
      return { id: '!anon' };
    }
    return getUser();
  }, [isAnon]);
  const apiKey = api_key ?? envApiKey;

  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey,
      ...(!isAnon && {
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiamRpbW92c2thIn0.Jaylbpd3g2RLwAT8v4fsYSx-eISZgoiWg287S1yXeN4\n',
      }),
      user: isAnon ? { type: 'anonymous' } : { ...user, id: 'jdimovska' },
    });
    setClient(_client);

    return () => {
      _client
        .disconnectUser()
        .catch((error) => console.error(`Unable to disconnect user`, error));
      setClient(undefined);
    };
  }, [apiKey, callId, isAnon, type, user]);

  return client;
};
