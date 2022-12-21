/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {useMemo} from 'react';
import {UserList} from './src/components/UserList';
import {AppProvider, useAppContext} from './src/context/AppContext';
import {useClient} from './src/hooks/useClient';
import {
  ChannelList,
  Chat,
  OverlayProvider,
  Streami18n,
} from 'stream-chat-react-native';
import {StreamChatGenerics} from './src/types';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {useStreamChatTheme} from './useStreamChatTheme';
import {ChannelSort} from 'stream-chat';
import {View} from 'react-native';

const streami18n = new Streami18n({
  language: 'en',
});

const sort: ChannelSort<StreamChatGenerics> = {last_message_at: -1};
const options = {
  presence: true,
  state: true,
  watch: true,
  limit: 30,
};

const RenderView = () => {
  const {userId, userToken, setChannel} = useAppContext();
  const {bottom} = useSafeAreaInsets();
  const theme = useStreamChatTheme();

  const filters = {
    type: 'messaging',
    members: {$in: [userId]},
  };

  const client = useClient({
    apiKey: '5mxvmc2t4qys',
    userData: {id: userId!!},
    tokenOrProvider: userToken,
  });

  if (!client) {
    return (
      <SafeAreaView>
        <UserList />
      </SafeAreaView>
    );
  } else {
    return (
      <OverlayProvider<StreamChatGenerics>
        bottomInset={bottom}
        i18nInstance={streami18n}
        value={{style: theme}}>
        <Chat client={client} i18nInstance={streami18n}>
          <SafeAreaView style={{height: '100%'}}>
            <ChannelList<StreamChatGenerics>
              filters={filters}
              onSelect={channel => {
                setChannel(channel);
              }}
              options={options}
              sort={sort}
            />
          </SafeAreaView>
        </Chat>
      </OverlayProvider>
    );
  }
};

const App = () => {
  const theme = useStreamChatTheme();

  return (
    <AppProvider>
      <SafeAreaProvider
        style={{backgroundColor: theme.colors?.white_snow || '#FCFCFC'}}>
        <RenderView />
      </SafeAreaProvider>
    </AppProvider>
  );
};

export default App;
