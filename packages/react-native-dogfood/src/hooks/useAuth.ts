import { StreamVideoClient, User } from '@stream-io/video-client';
import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { createToken } from '../modules/helpers/jwt';

const APIParams = {
  apiKey: 'w6yaq5388uym', // see <video>/data/fixtures/apps.yaml for API key/secret
  apiSecret: 'vavkn7b96xvy6y5frbc8kynkmqfg4feuwchdtkpkb44jywrvevwpeets35aqsmwv',
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
        const user: User = {
          id: username,
          name: username,
          role: 'admin',
          teams: ['team-1, team-2'],
          image: userImageUrl,
        };

        const token = await createToken(username, APIParams.apiSecret);
        Sentry.setUser({ ...user, token });
        try {
          const _videoClient = new StreamVideoClient(APIParams.apiKey);
          await _videoClient.connectUser(user, token);
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
