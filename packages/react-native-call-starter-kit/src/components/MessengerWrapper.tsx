import {
  Chat,
  OverlayProvider,
  Streami18n,
  useChatContext,
} from 'stream-chat-react-native';
import React, {PropsWithChildren, useCallback, useMemo} from 'react';
import {useVideoClient} from '../hooks/useVideoClient';
import {StreamCall, StreamVideo} from '@stream-io/video-react-native-sdk';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {userFromToken} from '../utils/userFromToken';
import {useChatClient} from '../hooks/useChatClient';
import {useStreamChatTheme} from '../../useStreamChatTheme';
import {AuthProgressLoader} from './AuthProgressLoader';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {
  NavigationStackParamsList,
  StreamChatGenerics,
  VideoProps,
} from '../types';
import {STREAM_API_KEY} from 'react-native-dotenv';
import {useAppContext} from '../context/AppContext';

export const VideoWrapper = ({
  children,
  navigation,
}: PropsWithChildren<{
  navigation: NativeStackNavigationProp<NavigationStackParamsList>;
}>) => {
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

  const acceptCallHandler = useCallback(() => {
    navigation.navigate('ActiveCallScreen');
  }, [navigation]);

  const outgoingCallHandler = useCallback(() => {
    navigation.navigate('OutgoingCallScreen');
  }, [navigation]);

  const incomingCallHandler = useCallback(() => {
    navigation.navigate('IncomingCallScreen');
  }, [navigation]);

  if (!videoClient) {
    return <AuthProgressLoader />;
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamCall
        onAcceptCall={acceptCallHandler}
        onOutgoingCall={outgoingCallHandler}
        onIncomingCall={incomingCallHandler}>
        {children}
      </StreamCall>
    </StreamVideo>
  );
};

const streami18n = new Streami18n({
  language: 'en',
});

export const MessengerWrapper = ({
  children,
  navigation,
}: PropsWithChildren<{
  navigation: NativeStackNavigationProp<NavigationStackParamsList>;
}>) => {
  const {userToken} = useAppContext();
  const user = useMemo(() => userFromToken(userToken), [userToken]);
  const chatClient = useChatClient({
    apiKey: STREAM_API_KEY,
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
        <VideoWrapper navigation={navigation}>{children}</VideoWrapper>
      </Chat>
    </OverlayProvider>
  );
};
