import React from 'react';
import {UserList} from './src/components/UserList';
import {StreamChatProvider} from './src/context/StreamChatContext';
import {useClient} from './src/hooks/useClient';
import {Chat, OverlayProvider, Streami18n} from 'stream-chat-react-native';
import {StreamChatGenerics, NavigationStackParamsList} from './src/types';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {useStreamChatTheme} from './useStreamChatTheme';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ChannelListScreen} from './src/screens/ChannelListScreen';
import {NavigationContainer} from '@react-navigation/native';
import {ChannelScreen} from './src/screens/ChannelScreen';
import {ThreadScreen} from './src/screens/ThreadScreen';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {ActivityIndicator, StyleSheet} from 'react-native';
import {NavigationHeader} from './src/components/NavigationHeader';
import {
  AppGlobalContextProvider,
  useAppGlobalStoreValue,
} from './src/context/AppContext';

const streami18n = new Streami18n({
  language: 'en',
});

const Stack = createNativeStackNavigator<NavigationStackParamsList>();

const Messenger = () => {
  const userId = useAppGlobalStoreValue(store => store.userId);
  const userToken = useAppGlobalStoreValue(store => store.userToken);
  const {bottom} = useSafeAreaInsets();
  const theme = useStreamChatTheme();

  const client = useClient({
    apiKey: '5mxvmc2t4qys',
    userData: {id: userId},
    tokenOrProvider: userToken,
  });

  if (!client) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
      </SafeAreaView>
    );
  }
  return (
    <StreamChatProvider>
      <GestureHandlerRootView style={styles.container}>
        <OverlayProvider<StreamChatGenerics>
          bottomInset={bottom}
          i18nInstance={streami18n}
          value={{style: theme}}>
          <Chat client={client} i18nInstance={streami18n}>
            <Stack.Navigator>
              <Stack.Screen
                name="ChannelListScreen"
                component={ChannelListScreen}
                options={{header: NavigationHeader}}
              />
              <Stack.Screen name="ChannelScreen" component={ChannelScreen} />
              <Stack.Screen name="ThreadScreen" component={ThreadScreen} />
            </Stack.Navigator>
          </Chat>
        </OverlayProvider>
      </GestureHandlerRootView>
    </StreamChatProvider>
  );
};

const RenderView = () => {
  const userId = useAppGlobalStoreValue(store => store.userId);
  const userToken = useAppGlobalStoreValue(store => store.userToken);

  if (!(userId && userToken)) {
    return (
      <SafeAreaView>
        <UserList />
      </SafeAreaView>
    );
  } else {
    return <Messenger />;
  }
};

const App = () => {
  const theme = useStreamChatTheme();

  return (
    <NavigationContainer>
      <AppGlobalContextProvider>
        <SafeAreaProvider
          style={{backgroundColor: theme.colors?.white_snow || '#FCFCFC'}}>
          <RenderView />
        </SafeAreaProvider>
      </AppGlobalContextProvider>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
