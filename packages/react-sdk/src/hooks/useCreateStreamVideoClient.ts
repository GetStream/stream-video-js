import {
  StreamVideoClient,
  CallConfig,
  User,
  TokenOrProvider,
} from '@stream-io/video-client';
import { useEffect, useRef, useState } from 'react';

export type StreamVideoClientInit = {
  apiKey: string;
  token: TokenOrProvider;
  callConfig?: CallConfig;
  user: User;
};

export const useCreateStreamVideoClient = ({
  callConfig,
  apiKey,
  token,
  user,
}: StreamVideoClientInit) => {
  const [client] = useState<StreamVideoClient>(
    () => new StreamVideoClient(apiKey, {}, callConfig),
  );
  const disconnectRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const connection = disconnectRef.current.then(() =>
      // FIXME: OL: await until connection is established, then return client
      client.connectUser(user, token).catch((err) => {
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
  }, [apiKey, token, client, user.id]);

  return client;
};
