import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { useEffect, useState } from 'react';

import { useAppGlobalStoreValue } from '../contexts/AppContext';

export const useAnonymousInitVideoClient = () => {
  const apiKey = useAppGlobalStoreValue((store) => store.apiKey);

  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    let _client: StreamVideoClient | undefined;
    const run = async () => {
      _client = new StreamVideoClient({
        apiKey,
        user: { type: 'anonymous' },
      });
      setClient(_client);
    };
    run();

    return () => {
      _client
        ?.disconnectUser()
        .catch((error) => console.error('Unable to disconnect user', error));
      setClient(undefined);
    };
  }, [apiKey]);

  return client;
};
