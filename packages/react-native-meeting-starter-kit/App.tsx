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
import {CallParticipansInfoScreen} from './src/screens/CallParticipantsInfoScreen';
import {CallLobbyScreen} from './src/screens/CallLobbyScreen';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  NavigationContainer,
  NavigationProp,
  useNavigation,
} from '@react-navigation/native';
import {AppProvider, useAppContext} from './src/context/AppContext';
import {useVideoClient} from './src/hooks/useVideoClient';
import {StreamMeeting, StreamVideo} from '@stream-io/video-react-native-sdk';
import {AuthProgressLoader} from './src/components/AuthProgressLoader';
import {NavigationHeader} from './src/components/NavigationHeader';

const Stack = createNativeStackNavigator<NavigationStackParamsList>();

const Navigator = () => {
  const {user, callID} = useAppContext();
  const {videoClient} = useVideoClient({
    user: user,
    token: user?.token,
  });
  const navigation = useNavigation<NavigationProp<NavigationStackParamsList>>();

  if (!user) {
    return <UserList />;
  }

  if (!videoClient) {
    return <AuthProgressLoader />;
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamMeeting
        callId={callID!!}
        callType="default"
        onActiveCall={() => navigation.navigate('ActiveCallScreen')}>
        <Stack.Navigator>
          <Stack.Screen
            name="CallLobbyScreen"
            component={CallLobbyScreen}
            options={{header: NavigationHeader}}
          />
          <Stack.Screen
            name="ActiveCallScreen"
            component={ActiveCallScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="CallParticipantsInfoScreen"
            component={CallParticipansInfoScreen}
          />
        </Stack.Navigator>
      </StreamMeeting>
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
