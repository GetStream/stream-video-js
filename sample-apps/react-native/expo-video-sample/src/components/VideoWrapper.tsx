import React from 'react';
import { PropsWithChildren, useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { useAppContext } from '../context/AppContext';
import { createToken } from '../../utils/createToken';

export const VideoWrapper = ({ children }: PropsWithChildren<{}>) => {
  const { user } = useAppContext();
  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );

  useEffect(() => {
    let _videoClient: StreamVideoClient | undefined;
    const run = async () => {
      if (!user?.id) return;
      const { token, apiKey } = await createToken({ user_id: user.id });
      _videoClient = new StreamVideoClient({
        apiKey,
        user,
        token,
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
