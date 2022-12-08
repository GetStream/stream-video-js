import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActiveCallScreen from './src/screens/ActiveCallScreen';
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
import { AppGlobalContextProvider } from './src/contexts/AppContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PermissionsAndroid } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

const callKeepOptions = {
  ios: {
    appName: 'StreamReactNativeVideoSDKSample',
  },
  android: {
    alertTitle: 'Permissions required',
    alertDescription: 'This application needs to access your phone accounts',
    cancelButton: 'Cancel',
    okButton: 'ok',
    imageName: 'phone_account_icon',
    additionalPermissions: [PermissionsAndroid.PERMISSIONS.READ_CONTACTS],
    selfManaged: true,
    // Required to get audio in background when using Android 11
    foregroundService: {
      channelId: 'io.getstream.rnvideosample',
      channelName: 'Foreground service for the app Stream React Native Dogfood',
      notificationTitle: 'App is running on background',
      notificationIcon: 'Path to the resource icon of the notification',
    },
  },
};

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
    <StreamVideo callKeepOptions={callKeepOptions} client={videoClient}>
      <Stack.Navigator>
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{ header: NavigationHeader }}
        />
        <Stack.Screen
          name="ActiveCallScreen"
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
    <SafeAreaProvider>
      <AppGlobalContextProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </AppGlobalContextProvider>
    </SafeAreaProvider>
  );
}
