import React from 'react';
import {UserList} from './src/components/UserList';
import {NavigationStackParamsList} from './src/types';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useStreamChatTheme} from './useStreamChatTheme';
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import {ChannelListScreen} from './src/screens/ChannelListScreen';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {ChannelScreen} from './src/screens/ChannelScreen';
import {ThreadScreen} from './src/screens/ThreadScreen';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaView, StyleSheet} from 'react-native';
import {NavigationHeader} from './src/components/NavigationHeader';
import {
  AppGlobalContextProvider,
  useAppGlobalStoreValue,
} from './src/context/AppContext';
import {MessengerWrapper} from './src/components/MessengerWrapper';
import {ChannelHeader} from './src/components/ChannelHeader';
import IncomingCallScreen from './src/screens/IncomingCallScreen';
import {ActiveCallScreen} from './src/screens/ActiveCallScreen';
import OutgoingCallScreen from './src/screens/OutgoingCallScreen';

const Stack = createNativeStackNavigator<NavigationStackParamsList>();

const Messenger = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<NavigationStackParamsList>>();

  return (
    <MessengerWrapper navigation={navigation}>
      <Stack.Navigator>
        <Stack.Screen
          name="ChannelListScreen"
          component={ChannelListScreen}
          options={{header: NavigationHeader}}
        />
        <Stack.Screen
          name="ChannelScreen"
          component={ChannelScreen}
          options={{
            header: props => <ChannelHeader {...props} />,
          }}
        />
        <Stack.Screen name="ThreadScreen" component={ThreadScreen} />
        <Stack.Screen
          name="IncomingCallScreen"
          component={IncomingCallScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ActiveCallScreen"
          component={ActiveCallScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="OutgoingCallScreen"
          component={OutgoingCallScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </MessengerWrapper>
  );
};

const RenderView = () => {
  const userId = useAppGlobalStoreValue(store => store.userId);
  const userToken = useAppGlobalStoreValue(store => store.userToken);
  const theme = useStreamChatTheme();

  if (!(userId && userToken)) {
    return (
      <SafeAreaView>
        <UserList />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaProvider
      style={{backgroundColor: theme.colors?.white_snow || '#FCFCFC'}}>
      <GestureHandlerRootView style={styles.container}>
        <Messenger />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <AppGlobalContextProvider>
        <RenderView />
      </AppGlobalContextProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
