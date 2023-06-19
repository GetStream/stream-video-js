import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import { Chat, OverlayProvider, Streami18n } from 'stream-chat-react-native';
import { useChatClient } from '../hooks/useChatClient';
import { AuthenticationProgress } from './AuthenticatingProgress';
import { StreamChatGenerics } from '../../types';
import { STREAM_API_KEY } from 'react-native-dotenv';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { createToken } from '../modules/helpers/createToken';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

const streami18n = new Streami18n({
  language: 'en',
});

export const ChatWrapper = ({ children }: PropsWithChildren<{}>) => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);

  const user = useMemo(
    () => ({
      id: username,
      name: username,
      imageUrl: userImageUrl,
    }),
    [username, userImageUrl],
  );

  const tokenProvider = useCallback(async () => {
    const token = await createToken({ user_id: username });
    return token;
  }, [username]);

  const chatClient = useChatClient({
    apiKey: STREAM_API_KEY,
    userData: user,
    tokenProvider: tokenProvider,
  });

  if (!chatClient) {
    return <AuthenticationProgress />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <OverlayProvider<StreamChatGenerics> i18nInstance={streami18n}>
        <Chat client={chatClient} i18nInstance={streami18n}>
          {children}
        </Chat>
      </OverlayProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
