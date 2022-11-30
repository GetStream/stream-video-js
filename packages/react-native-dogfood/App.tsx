import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActiveCallScreen from './src/screens/ActiveCall';
import { AppGlobalContextProvider } from './src/contexts/AppContext';

import { RootStackParamList } from './types';
import LoginScreen from './src/screens/LoginScreen';
import { NavigationHeader } from './src/components/NavigationHeader';
import { HomeScreen } from './src/screens/HomeScreen';
import IncomingCallScreen from './src/screens/IncomingCallScreen';
import { useAuth } from './src/hooks/useAuth';
import AuthenticatingProgressScreen from './src/screens/AuthenticatingProgress';
import { useProntoLinkEffect } from './src/hooks/useProntoLinkEffect';
import OutgoingCallScreen from './src/screens/OutgoingCallScreen';
import { StreamVideo } from '@stream-io/video-react-native-sdk';
import { LogBox } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

LogBox.ignoreAllLogs();

const StackNavigator = () => {
  useProntoLinkEffect();
  const { authenticationInProgress, videoClient } = useAuth();

  if (authenticationInProgress) {
    return <AuthenticatingProgressScreen />;
  }
  if (!videoClient) {
    return <LoginScreen />;
  }
  return (
    <StreamVideo client={videoClient}>
      <Stack.Navigator>
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{ header: NavigationHeader }}
        />
        <Stack.Screen
          name="ActiveCall"
          component={ActiveCallScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="IncomingCallScreen"
          component={IncomingCallScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OutgoingCallScreen"
          component={OutgoingCallScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </StreamVideo>
  );
};

export default function App() {
  return (
    <AppGlobalContextProvider>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </AppGlobalContextProvider>
  );
}
