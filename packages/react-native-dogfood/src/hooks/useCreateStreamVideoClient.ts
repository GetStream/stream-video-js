import { useEffect } from 'react';
import {
  useAppGlobalStoreValue,
  useAppGlobalStoreSetState,
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
  const videoClient = useAppGlobalStoreValue((store) => store.videoClient);
  const setState = useAppGlobalStoreSetState();
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
          setState({ videoClient: client });
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
            setState({ videoClient: undefined });
          })
          .catch((err) => {
            console.error('Failed to disconnect', err);
          });
      }
    };
  }, [apiKey, apiSecret, coordinatorRpcUrl, coordinatorWsUrl, setState, user]);

  return videoClient;
};
