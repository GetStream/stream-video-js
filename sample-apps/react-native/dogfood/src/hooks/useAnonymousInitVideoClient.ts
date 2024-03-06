import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { useEffect, useState } from 'react';

import { createToken } from '../modules/helpers/createToken';
import { useAppGlobalStoreValue } from '../contexts/AppContext';

type InitAnonymousVideoClientType = {
  callId?: string;
  callType?: string;
};

export const useAnonymousInitVideoClient = ({
  callId,
  callType,
}: InitAnonymousVideoClientType) => {
  const appEnvironment = useAppGlobalStoreValue(
    (store) => store.appEnvironment,
  );
  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    let _client: StreamVideoClient | undefined;
    const run = async () => {
      const anonymousUser = {
        id: '!anon',
      };
      const { token, apiKey } = await createToken(
        {
          user_id: anonymousUser.id,
          call_cids: `${callType}:${callId}`,
        },
        appEnvironment,
      );
      _client = new StreamVideoClient({
        apiKey,
        token,
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
  }, [callId, callType, appEnvironment]);

  return client;
};
