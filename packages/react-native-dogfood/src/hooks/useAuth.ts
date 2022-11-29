import { StreamVideoClient } from '@stream-io/video-client';
import { useEffect, useState } from 'react';
import {
  useAppGlobalStoreValue,
  useAppGlobalStoreSetState,
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

  const setState = useAppGlobalStoreSetState();
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

        try {
          const clientResponse = new StreamVideoClient(APIParams.apiKey, {
            coordinatorWsUrl: clientParams.coordinatorWsUrl,
            coordinatorRpcUrl: clientParams.coordinatorRpcUrl,
            sendJson: true,
            token,
          });
          await clientResponse.connect(APIParams.apiKey, token, user);
          setVideoClient(clientResponse);
        } catch (err) {
          console.error('Failed to establish connection', err);
          setState({
            username: '',
            userImageUrl: '',
          });
        }
        setAuthenticationInProgress(false);
      } else {
        setVideoClient(undefined);
      }
    };

    run();
  }, [setState, username, userImageUrl, isStoreInitialized]);

  return { authenticationInProgress, videoClient };
};
