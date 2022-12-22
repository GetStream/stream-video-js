import {
  Chat,
  OverlayProvider,
  Streami18n,
  useChatContext,
} from 'stream-chat-react-native';
import type {StreamChatGenerics, VideoProps} from '../types';
import React, {PropsWithChildren, ReactNode, useMemo} from 'react';
import {useVideoClient} from '../hooks/useVideoClient';
import {StreamVideo} from '@stream-io/video-react-native-sdk';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppGlobalStoreValue} from '../context/AppContext';
import {userFromToken} from '../utils/userFromToken';
import {useChatClient} from '../hooks/useChatClient';
import {StreamChatProvider} from '../context/StreamChatContext';
import {useStreamChatTheme} from '../../useStreamChatTheme';
import {AuthProgressLoader} from './AuthProgressLoader';

export const Video = ({children}: {children: ReactNode}) => {
  const {client} = useChatContext<StreamChatGenerics>();

  const user = useMemo<VideoProps['user']>(
    () => ({
      id: client.user?.id as string,
      name: client.user?.name as string,
      role: client.user?.role as string,
      imageUrl: client.user?.image as string,
      teams: [],
      customJson: new Uint8Array(),
    }),
    [client.user],
  );
  const token = client._getToken() || '';

  const {videoClient} = useVideoClient({user, token});

  if (!videoClient) {
    return <AuthProgressLoader />;
  }
  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

const streami18n = new Streami18n({
  language: 'en',
});

export const MessengerWrapper = ({children}: PropsWithChildren<{}>) => {
  const userToken = useAppGlobalStoreValue(store => store.userToken);
  const user = useMemo(() => userFromToken(userToken), [userToken]);
  const chatClient = useChatClient({
    apiKey: '5mxvmc2t4qys',
    userData: user,
    tokenOrProvider: userToken,
  });
  const {bottom} = useSafeAreaInsets();
  const theme = useStreamChatTheme();

  if (!chatClient) {
    return <AuthProgressLoader />;
  }

  return (
    <OverlayProvider<StreamChatGenerics>
      bottomInset={bottom}
      i18nInstance={streami18n}
      value={{style: theme}}>
      <Chat client={chatClient} i18nInstance={streami18n}>
        <StreamChatProvider>
          {chatClient ? <Video>{children}</Video> : <>{children}</>}
        </StreamChatProvider>
      </Chat>
    </OverlayProvider>
  );
};
