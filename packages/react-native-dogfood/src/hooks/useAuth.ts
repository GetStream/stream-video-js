import { NavigationProp, useNavigation } from '@react-navigation/native';
import { StreamVideoClient } from '@stream-io/video-client';
import { useEffect, useState } from 'react';
import { RootStackParamList } from '../../types';
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
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const isStoreInitialized = useAppGlobalStoreValue(
    (store) => store.isStoreInitialized,
  );
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const appSetState = useAppGlobalStoreSetState();
  const [authenticationInProgress, setAuthenticationInProgress] =
    useState(true);
  const [client, setClient] = useState<StreamVideoClient | undefined>();

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
          const videoClient = new StreamVideoClient(APIParams.apiKey, {
            coordinatorWsUrl: clientParams.coordinatorWsUrl,
            coordinatorRpcUrl: clientParams.coordinatorRpcUrl,
            sendJson: true,
            token,
          });
          await videoClient.connect(APIParams.apiKey, token, user);
          setClient(videoClient);
        } catch (err) {
          console.error('Failed to establish connection', err);
          appSetState({
            username: '',
            userImageUrl: '',
          });
        }
      }
      setAuthenticationInProgress(false);
    };

    run();
  }, [appSetState, navigation, username, userImageUrl, isStoreInitialized]);

  return { authenticationInProgress, client };
};
