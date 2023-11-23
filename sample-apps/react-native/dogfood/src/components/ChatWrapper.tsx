import React, { PropsWithChildren, useMemo } from 'react';
import { Chat, OverlayProvider, Streami18n } from 'stream-chat-react-native';
import { useChatClient } from '../hooks/useChatClient';
import { AuthenticationProgress } from './AuthenticatingProgress';
import { StreamChatGenerics } from '../../types';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { useStreamChatTheme } from '../hooks/useTheme';

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

  const chatClient = useChatClient({
    userData: user,
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
