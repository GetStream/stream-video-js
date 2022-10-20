import { useEffect } from 'react';
import {
  useAppSetterContext,
  useAppValueContext,
} from '../contexts/AppContext';
import { createToken } from '../modules/helpers/jwt';
import { StreamVideoClient, UserInput } from '@stream-io/video-client';

export type StreamVideoClientInit = {
  apiKey: string;
  apiSecret: string;
  coordinatorRpcUrl?: string;
  coordinatorWsUrl?: string;
  user: UserInput;
};

export const useCreateStreamVideoClient = ({
  coordinatorRpcUrl,
  coordinatorWsUrl,
  apiKey,
  apiSecret,
  user,
}: StreamVideoClientInit) => {
  const { videoClient } = useAppValueContext();
  const { setVideoClient } = useAppSetterContext();
  useEffect(() => {
    const connectionRef: {
      interrupted: boolean;
      connected: boolean;
      client: StreamVideoClient | undefined;
    } = {
      interrupted: false,
      connected: false,
      client: undefined,
    };
    const run = async () => {
      try {
        const token = await createToken(user.name, apiSecret);
        const client = new StreamVideoClient(apiKey, {
          coordinatorWsUrl,
          coordinatorRpcUrl,
          sendJson: true,
          token,
        });
        connectionRef.client = client;
        await client.connect(apiKey, token, user);
        connectionRef.connected = true;
        if (!connectionRef.interrupted) {
          setVideoClient(client);
        }
      } catch (err) {
        console.error('Failed to establish connection', err);
      }
    };
    run();
    return () => {
      connectionRef.interrupted = true;
      if (connectionRef.connected) {
        connectionRef.client
          ?.disconnect()
          .then(() => {
            setVideoClient(undefined);
          })
          .catch((err) => {
            console.error('Failed to disconnect', err);
          });
      }
    };
  }, [
    apiKey,
    apiSecret,
    coordinatorRpcUrl,
    coordinatorWsUrl,
    setVideoClient,
    user,
  ]);

  return videoClient;
};
