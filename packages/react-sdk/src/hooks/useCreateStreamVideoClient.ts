import {
  StreamVideoClient,
  CallConfig,
  User,
  TokenOrProvider,
  StreamClientOptions,
} from '@stream-io/video-client';
import { useEffect, useState } from 'react';

export type StreamVideoClientInit = {
  apiKey: string;
  token: TokenOrProvider;
  callConfig?: CallConfig;
  options?: StreamClientOptions;
  user: User;
};

export const useCreateStreamVideoClient = ({
  apiKey,
  token,
  user,
  options,
  callConfig,
}: StreamVideoClientInit) => {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  useEffect(() => {
    const videoClient = new StreamVideoClient(apiKey, options, callConfig);
    let didUserConnectInterrupt = false;
    const connection = videoClient
      .connectUser(user, token)
      .then(() => {
        if (!didUserConnectInterrupt) setClient(videoClient);
      })
      .catch((err) => {
        console.error(`Failed to establish connection`, err);
      });

    return () => {
      didUserConnectInterrupt = true;
      connection.then(() => {
        videoClient
          .disconnectUser()
          .then(() => {
            setClient(null);
          })
          .catch((err) => {
            console.error(`Failed to disconnect`, err);
          });
      });
    };
    // we want to re-run this effect only in some special cases
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, token, user.id]);

  return client;
};
