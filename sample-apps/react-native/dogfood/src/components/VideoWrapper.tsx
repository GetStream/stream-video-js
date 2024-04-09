import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import {
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { createToken } from '../modules/helpers/createToken';
import translations from '../translations';

export const VideoWrapper = ({ children }: PropsWithChildren<{}>) => {
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const userName = useAppGlobalStoreValue((store) => store.userName);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const appEnvironment = useAppGlobalStoreValue(
    (store) => store.appEnvironment,
  );
  const setState = useAppGlobalStoreSetState();

  const [videoClient, setVideoClient] = useState<StreamVideoClient | undefined>(
    undefined,
  );

  const user = useMemo(
    () => ({
      id: userId,
      name: userName,
      image: userImageUrl,
    }),
    [userId, userName, userImageUrl],
  );

  useEffect(() => {
    let _videoClient: StreamVideoClient | undefined;
    const run = async () => {
      const { token, apiKey } = await createToken(
        { user_id: user.id },
        appEnvironment,
      );
      setState({ apiKey: apiKey });
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
  }, [appEnvironment, setState, user]);

  if (!videoClient) {
    return null;
  }

  return (
    <StreamVideo client={videoClient} translationsOverrides={translations}>
      {children}
    </StreamVideo>
  );
};
