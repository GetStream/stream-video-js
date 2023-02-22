import {CALL_CONFIG, StreamVideoClient} from '@stream-io/video-client';
import {useEffect, useState} from 'react';
import {VideoProps} from '../types';
import {STREAM_API_KEY, STREAM_API_SECRET} from 'react-native-dotenv';
console.log('STREAM_API_KEY', STREAM_API_KEY);
console.log('STREAM_API_SECRET', STREAM_API_SECRET);
const APIParams = {
  apiKey: STREAM_API_KEY, // see <video>/data/fixtures/apps.yaml for API key/secret
  apiSecret: STREAM_API_SECRET,
};

export const useVideoClient = ({user, token}: VideoProps) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [authenticationInProgress, setAuthenticationInProgress] =
    useState(true);

  useEffect(() => {
    const run = async () => {
      setAuthenticationInProgress(true);

      try {
        const _videoClient = new StreamVideoClient(
          APIParams.apiKey,
          {},
          {...CALL_CONFIG.ring, autoCancelTimeoutInMs: 30 * 1000},
        );
        await _videoClient.connectUser(user, token);
        setVideoClient(_videoClient);
      } catch (err) {
        console.error('Failed to establish connection', err);
      }

      setAuthenticationInProgress(false);
    };

    run();
  }, [token, user]);

  return {authenticationInProgress, videoClient};
};
