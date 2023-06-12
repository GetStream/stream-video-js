import React, {PropsWithChildren} from 'react';
import {Chat, OverlayProvider, Streami18n} from 'stream-chat-react-native';
import {useAppContext} from '../context/AppContext';
import {useChatClient} from '../hooks/useChatClient';
import {STREAM_API_KEY} from 'react-native-dotenv';
import {useStreamChatTheme} from '../../useStreamChatTheme';
import {AuthProgressLoader} from './AuthProgressLoader';
import {StreamChatGenerics} from '../types';

const streami18n = new Streami18n({
  language: 'en',
});

export const ChatWrapper = ({children}: PropsWithChildren<{}>) => {
  const {user} = useAppContext();
  const chatClient = useChatClient({
    apiKey: STREAM_API_KEY,
    userData: user,
    tokenOrProvider: user?.custom && user?.custom.token,
  });
  const theme = useStreamChatTheme();

  if (!chatClient) {
    return <AuthProgressLoader />;
  }

  return (
    <OverlayProvider<StreamChatGenerics>
      i18nInstance={streami18n}
      value={{style: theme}}>
      <Chat client={chatClient} i18nInstance={streami18n}>
        {children}
      </Chat>
    </OverlayProvider>
  );
};
