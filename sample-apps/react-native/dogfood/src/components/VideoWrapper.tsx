import React, { PropsWithChildren, useEffect, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import { STREAM_API_KEY } from 'react-native-dotenv';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { createToken } from '../modules/helpers/createToken';
import translations from '../translations';
import { customSentryLogger } from '../utils/logger';

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
    const user = {
      id: userId,
      name: userName,
      image: userImageUrl,
    };
    const _videoClient = new StreamVideoClient({
      apiKey: STREAM_API_KEY,
      user,
      tokenProvider: async () => createToken({ user_id: user.id }),
      options: { logger: customSentryLogger, logLevel: 'warn' },
    });
    setVideoClient(_videoClient);

    return () => {
      _videoClient.disconnectUser();
      setVideoClient(undefined);
    };
  }, [userName, userId, userImageUrl]);

  if (!videoClient) {
    return null;
  }

  return (
    <StreamVideo
      client={videoClient}
      // By default we keep English(en) for now, unless we start supporting switching of language in the application
      language={'en'}
      translationsOverrides={translations}
    >
      {children}
    </StreamVideo>
  );
};
