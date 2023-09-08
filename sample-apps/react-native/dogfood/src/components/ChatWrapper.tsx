import React, { PropsWithChildren, useCallback, useMemo } from 'react';
import { Chat, OverlayProvider, Streami18n } from 'stream-chat-react-native';
import { useChatClient } from '../hooks/useChatClient';
import { AuthenticationProgress } from './AuthenticatingProgress';
import { StreamChatGenerics } from '../../types';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { createToken } from '../modules/helpers/createToken';
import { useStreamChatTheme } from '../hooks/useTheme';
import { STREAM_API_KEY } from '../../config';

const streami18n = new Streami18n({
  language: 'en',
});

export const ChatWrapper = ({ children }: PropsWithChildren<{}>) => {
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const userName = useAppGlobalStoreValue((store) => store.userName);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);

  const user = useMemo(
    () => ({
      id: userId,
      name: userName,
      imageUrl: userImageUrl,
    }),
    [userId, userName, userImageUrl],
  );

  const tokenProvider = useCallback(async () => {
    return await createToken({ user_id: userId });
  }, [userId]);

  const chatClient = useChatClient({
    apiKey: STREAM_API_KEY,
    userData: user,
    tokenProvider: tokenProvider,
  });
  const theme = useStreamChatTheme();

  if (!chatClient) {
    return <AuthenticationProgress />;
  }

  return (
    <OverlayProvider<StreamChatGenerics>
      i18nInstance={streami18n}
      value={{ style: theme }}
    >
      <Chat client={chatClient} i18nInstance={streami18n}>
        {children}
      </Chat>
    </OverlayProvider>
  );
};
