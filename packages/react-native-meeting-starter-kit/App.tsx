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
  StreamVideoCall,
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
import {User} from '@stream-io/video-client';

console.log('STREAM_API_KEY', STREAM_API_KEY);

const Stack = createNativeStackNavigator<NavigationStackParamsList>();

const Root = () => {
  const {user} = useAppContext();
  if (!user) {
    return <UserList />;
  }

  return <Navigator selectedUser={user} />;
};

const Navigator = ({selectedUser}: {selectedUser: User}) => {
  const videoClient = useCreateStreamVideoClient({
    user: selectedUser,
    tokenOrProvider: selectedUser.custom?.token,
    apiKey: STREAM_API_KEY,
  });
  const navigation =
    useNavigation<NativeStackNavigationProp<NavigationStackParamsList>>();
  const {
    callParams: {callId, callType},
  } = useAppContext();

  if (!videoClient) {
    return <AuthProgressLoader />;
  }

  return (
    <StreamVideoCall
      client={videoClient}
      callId={callId}
      callType={callType}
      callCycleHandlers={{
        onCallHungUp: () => navigation.navigate('JoinMeetingScreen'),
        onCallJoined: () => navigation.navigate('ActiveCallScreen'),
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
    </StreamVideoCall>
  );
};

function App(): JSX.Element {
  return (
    <NavigationContainer>
      <AppProvider>
        <Root />
      </AppProvider>
    </NavigationContainer>
  );
}

export default App;
