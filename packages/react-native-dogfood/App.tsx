import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActiveCallScreen from './src/screens/ActiveCall';
import { RootStackParamList } from './types';
import LoginScreen from './src/screens/LoginScreen';
import { NavigationHeader } from './src/components/NavigationHeader';
import { HomeScreen } from './src/screens/HomeScreen';
import IncomingCallScreen from './src/screens/IncomingCallScreen';
import { useAuth } from './src/hooks/useAuth';
import AuthenticatingProgressScreen from './src/screens/AuthenticatingProgress';
import { useProntoLinkEffect } from './src/hooks/useProntoLinkEffect';
import OutgoingCallScreen from './src/screens/OutgoingCallScreen';
import {
  StreamVideoProvider,
  useStreamVideoStoreValue,
} from '@stream-io/video-react-native-sdk';
import { AppGlobalContextProvider } from './src/contexts/AppContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  useProntoLinkEffect();
  const { authenticationInProgress } = useAuth();
  const videoClient = useStreamVideoStoreValue((store) => store.videoClient);

  if (authenticationInProgress) {
    return <AuthenticatingProgressScreen />;
  }
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        header: NavigationHeader,
      }}
    >
      {!videoClient ? (
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="ActiveCall" component={ActiveCallScreen} />
          <Stack.Screen
            name="IncomingCallScreen"
            component={IncomingCallScreen}
          />
          <Stack.Screen
            name="OutgoingCallScreen"
            component={OutgoingCallScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <StreamVideoProvider>
      <AppGlobalContextProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </AppGlobalContextProvider>
    </StreamVideoProvider>
  );
}
