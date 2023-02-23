import {StreamVideoClient} from '@stream-io/video-client';
import {useEffect, useState} from 'react';
import {VideoProps} from '../types';
import {STREAM_API_KEY} from 'react-native-dotenv';
console.log('STREAM_API_KEY', STREAM_API_KEY);
const APIParams = {
  apiKey: STREAM_API_KEY, // see <video>/data/fixtures/apps.yaml for API key/secret
};

export const useVideoClient = ({user, token}: VideoProps) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [authenticationInProgress, setAuthenticationInProgress] =
    useState(true);

  useEffect(() => {
    const run = async () => {
      setAuthenticationInProgress(true);

      try {
        const client = new StreamVideoClient(APIParams.apiKey);
        await client.connectUser(user, token);
        setVideoClient(client);
      } catch (err) {
        console.error('Failed to establish connection', err);
      }

      setAuthenticationInProgress(false);
    };

    run();
  }, [token, user]);

  return {authenticationInProgress, videoClient};
};
