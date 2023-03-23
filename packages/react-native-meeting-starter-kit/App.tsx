/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {UserList} from './src/components/UserList';
import {NavigationStackParamsList} from './src/types';
import {ActiveCallScreen} from './src/screens/ActiveCallScreen';
import {LobbyViewScreen} from './src/screens/LobbyViewScreen';
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {AppProvider, useAppContext} from './src/context/AppContext';
import {
  CallParticipantsInfoView,
  StreamVideo,
  useVideoClient,
} from '@stream-io/video-react-native-sdk';
import {AuthProgressLoader} from './src/components/AuthProgressLoader';
import {NavigationHeader} from './src/components/NavigationHeader';
import {JoinMeetingScreen} from './src/screens/JoinMeetingScreen';
import {STREAM_API_KEY} from 'react-native-dotenv';
console.log('STREAM_API_KEY', STREAM_API_KEY);

const Stack = createNativeStackNavigator<NavigationStackParamsList>();

const Navigator = () => {
  const {user} = useAppContext();
  const {videoClient} = useVideoClient({
    user: user,
    token: user?.token,
    apiKey: STREAM_API_KEY,
  });
  const navigation =
    useNavigation<NativeStackNavigationProp<NavigationStackParamsList>>();

  if (!user) {
    return <UserList />;
  }

  if (!videoClient) {
    return <AuthProgressLoader />;
  }

  return (
    <StreamVideo
      client={videoClient}
      callCycleHandlers={{
        onActiveCall: () => navigation.navigate('ActiveCallScreen'),
        onHangupCall: () => navigation.navigate('JoinMeetingScreen'),
      }}>
      <Stack.Navigator>
        <Stack.Screen
          name="JoinMeetingScreen"
          component={JoinMeetingScreen}
          options={{header: NavigationHeader}}
        />
        <Stack.Screen
          name="CallLobbyScreen"
          component={LobbyViewScreen}
          options={{header: NavigationHeader}}
        />
        <Stack.Screen
          name="ActiveCallScreen"
          component={ActiveCallScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="CallParticipantsInfoScreen"
          component={CallParticipantsInfoView}
        />
      </Stack.Navigator>
    </StreamVideo>
  );
};

function App(): JSX.Element {
  return (
    <NavigationContainer>
      <AppProvider>
        <Navigator />
      </AppProvider>
    </NavigationContainer>
  );
}

export default App;
