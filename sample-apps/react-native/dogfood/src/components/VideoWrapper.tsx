import React, { PropsWithChildren, useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { createToken } from '../modules/helpers/createToken';
import translations from '../translations';

export const VideoWrapper = ({ children }: PropsWithChildren<{}>) => {
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const userName = useAppGlobalStoreValue((store) => store.userName);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);

  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!userId || !userImageUrl) {
      return;
    }
    let _videoClient: StreamVideoClient | undefined;
    const run = async () => {
      const user = {
        id: userId,
        name: userName,
        image: userImageUrl,
      };
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
  }, [userName, userId, userImageUrl]);

  if (!videoClient) {
    return null;
  }

  return (
    <StreamVideo client={videoClient} translationsOverrides={translations}>
      {children}
    </StreamVideo>
  );
};
