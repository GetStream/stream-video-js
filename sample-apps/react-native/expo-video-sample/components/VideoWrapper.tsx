import React from 'react';
import { PropsWithChildren, useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { useAppContext } from '../context/AppContext';
import { createToken } from '../utils/createToken';

export const VideoWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { user } = useAppContext();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );

  useEffect(() => {
    let _videoClient: StreamVideoClient | undefined;
    const run = async () => {
      const user_id = user?.id;
      if (!user_id) return;
      const fetchAuthDetails = async () => {
        return await createToken({ user_id });
      };
      const { apiKey } = await fetchAuthDetails();
      const tokenProvider = () => fetchAuthDetails().then((auth) => auth.token);
      _videoClient = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user,
        tokenProvider,
        options: { logLevel: 'warn' },
      });
      setVideoClient(_videoClient);
    };
    run();

    return () => {
      _videoClient?.disconnectUser();
      setVideoClient(undefined);
    };
  }, [user]);

  if (!videoClient) {
    return null;
  }

  // @ts-ignore
  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};
