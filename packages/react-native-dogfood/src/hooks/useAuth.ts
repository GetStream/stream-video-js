import { StreamVideoClient } from '@stream-io/video-client';
import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { createToken } from '../modules/helpers/jwt';

const APIParams = {
  apiKey: 'key10', // see <video>/data/fixtures/apps.yaml for API key/secret
  apiSecret: 'secret10',
};

export const useAuth = () => {
  const isStoreInitialized = useAppGlobalStoreValue(
    (store) => store.isStoreInitialized,
  );
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const appSetState = useAppGlobalStoreSetState();
  const [authenticationInProgress, setAuthenticationInProgress] =
    useState(true);

  useEffect(() => {
    const run = async () => {
      if (!isStoreInitialized) {
        return;
      }
      if (username && userImageUrl) {
        setAuthenticationInProgress(true);
        const user = {
          id: username,
          name: username,
          role: 'admin',
          teams: ['team-1, team-2'],
          imageUrl: userImageUrl,
          customJson: new Uint8Array(),
        };
        const clientParams = {
          // coordinatorRpcUrl: 'http://192.168.50.95:26991/rpc',
          // coordinatorWsUrl:
          //   'ws://192.168.50.95:8989/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
          coordinatorRpcUrl:
            'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
          coordinatorWsUrl:
            'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',
        };

        const token = await createToken(username, APIParams.apiSecret);
        Sentry.setUser({ ...user, token });
        try {
          const _videoClient = new StreamVideoClient(APIParams.apiKey, {
            coordinatorWsUrl: clientParams.coordinatorWsUrl,
            coordinatorRpcUrl: clientParams.coordinatorRpcUrl,
            sendJson: true,
            token,
          });
          await _videoClient.connect(APIParams.apiKey, token, user);
          setVideoClient(_videoClient);
        } catch (err) {
          console.error('Failed to establish connection', err);
          appSetState({
            username: '',
            userImageUrl: '',
          });
        }
      } else {
        setVideoClient(undefined);
      }
      setAuthenticationInProgress(false);
    };

    run();
  }, [appSetState, username, userImageUrl, isStoreInitialized]);

  return { authenticationInProgress, videoClient };
};
