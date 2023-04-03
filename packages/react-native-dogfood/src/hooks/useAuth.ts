import { CALL_CONFIG, StreamVideoClient, User } from '@stream-io/video-client';
import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { createToken } from '../modules/helpers/jwt';
import { STREAM_API_KEY, STREAM_API_SECRET } from 'react-native-dotenv';

const APIParams = {
  apiKey: STREAM_API_KEY,
  apiSecret: STREAM_API_SECRET,
};

export const useAuth = () => {
  const isStoreInitialized = useAppGlobalStoreValue(
    (store) => store.isStoreInitialized,
  );
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const appMode = useAppGlobalStoreValue((store) => store.appMode);
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
          let _videoClient;
          if (appMode === 'Meeting') {
            _videoClient = new StreamVideoClient(APIParams.apiKey);
          } else {
            console.log('ring');
            _videoClient = new StreamVideoClient(
              APIParams.apiKey,
              {},
              CALL_CONFIG.ring,
            );
          }
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
  }, [appSetState, appMode, username, userImageUrl, isStoreInitialized]);

  return { authenticationInProgress, videoClient };
};
