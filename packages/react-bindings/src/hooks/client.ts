import {
  CallConfig,
  StreamClientOptions,
  StreamVideoClient,
} from '@stream-io/video-client';
import { useEffect, useState } from 'react';

type UserType = {
  id: string;
  name: string;
  imageUrl: string;
  token: string;
};

type VideoClientProps = {
  user: UserType;
  token: string;
  apiKey: string;
  callConfig?: CallConfig;
  opts?: StreamClientOptions;
};

/**
 * Utility hook which instantiate a video client *
 * @category Call State
 */
export const useVideoClient = ({
  user,
  token,
  apiKey,
  callConfig,
  opts = {},
}: VideoClientProps) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [authenticationInProgress, setAuthenticationInProgress] =
    useState(true);

  useEffect(() => {
    const run = async () => {
      setAuthenticationInProgress(true);

      try {
        const _videoClient = new StreamVideoClient(apiKey, opts, callConfig);
        await _videoClient.connectUser(user, token);
        setVideoClient(_videoClient);
      } catch (err) {
        console.error('Failed to establish connection', err);
      }

      setAuthenticationInProgress(false);
    };

    run();
  }, [apiKey, callConfig, opts, token, user]);

  return { authenticationInProgress, videoClient };
};
