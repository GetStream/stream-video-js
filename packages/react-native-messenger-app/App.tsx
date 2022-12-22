import React from 'react';
import {UserList} from './src/components/UserList';
import {NavigationStackParamsList} from './src/types';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {useStreamChatTheme} from './useStreamChatTheme';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ChannelListScreen} from './src/screens/ChannelListScreen';
import {NavigationContainer} from '@react-navigation/native';
import {ChannelScreen} from './src/screens/ChannelScreen';
import {ThreadScreen} from './src/screens/ThreadScreen';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {StyleSheet} from 'react-native';
import {NavigationHeader} from './src/components/NavigationHeader';
import {
  AppGlobalContextProvider,
  useAppGlobalStoreValue,
} from './src/context/AppContext';
import {MessengerWrapper} from './src/components/MessengerWrapper';

const Stack = createNativeStackNavigator<NavigationStackParamsList>();

const Messenger = () => {
  return (
    <MessengerWrapper>
      <Stack.Navigator>
        <Stack.Screen
          name="ChannelListScreen"
          component={ChannelListScreen}
          options={{header: NavigationHeader}}
        />
        <Stack.Screen name="ChannelScreen" component={ChannelScreen} />
        <Stack.Screen name="ThreadScreen" component={ThreadScreen} />
      </Stack.Navigator>
    </MessengerWrapper>
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
          <GestureHandlerRootView style={styles.container}>
            <RenderView />
          </GestureHandlerRootView>
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
