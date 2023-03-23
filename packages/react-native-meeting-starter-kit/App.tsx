/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import {AppProvider, useAppContext} from './src/context/AppContext';
import {AuthProgressLoader} from './src/components/AuthProgressLoader';
import {STREAM_API_KEY} from 'react-native-dotenv';
import {
  CallParticipantsInfoView,
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {NavigationStackParamsList} from './src/types';
import {UserList} from './src/components/UserList';
import {JoinMeetingScreen} from './src/screens/JoinMeetingScreen';
import {NavigationHeader} from './src/components/NavigationHeader';
import {LobbyViewScreen} from './src/screens/LobbyViewScreen';
import {ActiveCallScreen} from './src/screens/ActiveCallScreen';

console.log('STREAM_API_KEY', STREAM_API_KEY);

const Stack = createNativeStackNavigator<NavigationStackParamsList>();

const Navigator = () => {
  const {user} = useAppContext();
  const videoClient = useCreateStreamVideoClient({
    user: user,
    tokenOrProvider: user?.custom?.token,
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
