import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { useEffect, useState } from 'react';

import { useAppGlobalStoreValue } from '../contexts/AppContext';

export const useAnonymousInitVideoClient = () => {
  const apiKey = useAppGlobalStoreValue((store) => store.apiKey);

  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    const _client = StreamVideoClient.getOrCreateInstance({
      apiKey,
      user: { type: 'anonymous' },
    });

    return () => {
      _client
        ?.disconnectUser()
        .catch((error) => console.error('Unable to disconnect user', error));
      setClient(undefined);
    };
  }, [apiKey]);

  return client;
};
