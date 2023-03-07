import {
  StreamVideoClient,
  CallConfig,
  User,
  TokenOrProvider,
  StreamClientOptions,
} from '@stream-io/video-client';
import { useEffect, useRef, useState } from 'react';

export type StreamVideoClientInit = {
  apiKey: string;
  tokenOrProvider: TokenOrProvider;
  callConfig?: CallConfig;
  options?: StreamClientOptions;
  user: User;
};

export const useCreateStreamVideoClient = ({
  apiKey,
  tokenOrProvider,
  user,
  options,
  callConfig,
}: StreamVideoClientInit) => {
  const [client] = useState(
    () => new StreamVideoClient(apiKey, options, callConfig),
  );
  const disconnectRef = useRef(Promise.resolve());
  useEffect(() => {
    const connection = disconnectRef.current.then(() =>
      client.connectUser(user, tokenOrProvider).catch((err) => {
        console.error(`Failed to establish connection`, err);
      }),
    );

    return () => {
      connection.then(() => {
        disconnectRef.current = client.disconnectUser();
        disconnectRef.current.catch((err) => {
          console.error(`Failed to disconnect`, err);
        });
      });
    };
    // we want to re-run this effect only in some special cases
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, tokenOrProvider, client, user.id]);

  return client;
};
