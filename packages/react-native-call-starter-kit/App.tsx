import React from 'react';
import {UserList} from './src/components/UserList';
import {NavigationStackParamsList} from './src/types';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useStreamChatTheme} from './useStreamChatTheme';
import {
  NativeStackHeaderProps,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import {ChannelListScreen} from './src/screens/ChannelListScreen';
import {NavigationContainer} from '@react-navigation/native';
import {ChannelScreen} from './src/screens/ChannelScreen';
import {ThreadScreen} from './src/screens/ThreadScreen';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaView, StyleSheet} from 'react-native';
import {NavigationHeader} from './src/components/NavigationHeader';
import {MessengerWrapper} from './src/components/MessengerWrapper';
import {ChannelHeader} from './src/components/ChannelHeader';
import {ActiveCallScreen} from './src/screens/ActiveCallScreen';
import {AppProvider, useAppContext} from './src/context/AppContext';
import {
  IncomingCallView,
  OutgoingCallView,
} from '@stream-io/video-react-native-sdk';

const Stack = createNativeStackNavigator<NavigationStackParamsList>();

function ChannelHeaderComponent(props: NativeStackHeaderProps) {
  return <ChannelHeader {...props} />;
}

const Messenger = () => {
  const {userId, userToken} = useAppContext();

  if (!(userId && userToken)) {
    return (
      <SafeAreaView>
        <UserList />
      </SafeAreaView>
    );
  }

  return (
    <MessengerWrapper>
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
            header: ChannelHeaderComponent,
          }}
        />
        <Stack.Screen name="ThreadScreen" component={ThreadScreen} />
        <Stack.Screen
          name="IncomingCallScreen"
          component={IncomingCallView}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ActiveCallScreen"
          component={ActiveCallScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="OutgoingCallScreen"
          component={OutgoingCallView}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </MessengerWrapper>
  );
};

const App = () => {
  const theme = useStreamChatTheme();

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider
        style={[
          styles.container,
          {backgroundColor: theme.colors?.white_snow || '#FCFCFC'},
        ]}>
        <NavigationContainer>
          <AppProvider>
            <Messenger />
          </AppProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
