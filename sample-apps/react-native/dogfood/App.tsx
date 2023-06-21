import * as React from 'react';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import {
  prontoCallId$,
  useProntoLinkEffect,
} from './src/hooks/useProntoLinkEffect';
import {
  AppGlobalContextProvider,
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from './src/contexts/AppContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  StaticNavigationService,
  navigationRef,
} from './src/utils/staticNavigationUtils';
import Logger from 'react-native-webrtc/src/Logger';
import { Meeting } from './src/navigators/Meeting';
import { Call } from './src/navigators/Call';
import { VideoWrapper } from './src/components/VideoWrapper';
import LoginScreen from './src/screens/LoginScreen';
import { ChatWrapper } from './src/components/ChatWrapper';
import { AppMode } from './src/navigators/AppMode';
import { setPushConfig } from './src/utils/setPushConfig';
import { PermissionsAndroid, Platform } from 'react-native';
import { StreamVideoRN } from '@stream-io/video-react-native-sdk';
import { useAppStateListener } from 'stream-chat-react-native';

// @ts-expect-error
Logger.enable(false);

const Stack = createNativeStackNavigator<RootStackParamList>();

// All the push notification related config must be done as soon the app starts
// since the app can be opened from a dead state through a push notification
setPushConfig();

const checkAndUpdatePermissions = async () => {
  // TODO(SG): ask with RN permissions
  if (Platform.OS === 'ios') {
    StreamVideoRN.setPermissions({
      isCameraPermissionGranted: true,
      isMicPermissionGranted: true,
    });
    return;
  }
  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  ]);
  StreamVideoRN.setPermissions({
    isCameraPermissionGranted:
      results[PermissionsAndroid.PERMISSIONS.CAMERA] ===
      PermissionsAndroid.RESULTS.GRANTED,
    isMicPermissionGranted:
      results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
      PermissionsAndroid.RESULTS.GRANTED,
  });
};
const handleOnForeground = async () => {
  const isCameraPermissionGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  const isMicPermissionGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );
  StreamVideoRN.setPermissions({
    isCameraPermissionGranted,
    isMicPermissionGranted,
  });
};
const StackNavigator = () => {
  const appMode = useAppGlobalStoreValue((store) => store.appMode);
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const setState = useAppGlobalStoreSetState();

  useProntoLinkEffect();

  // Ask for relevant permissions after screen is loaded and when app state changes
  // to foreground to make sure we have the latest permissions in order to subscribe
  // to audio/video devices
  useEffect(() => {
    checkAndUpdatePermissions();
  }, []);
  useAppStateListener(handleOnForeground, () => {});

  let mode;
  switch (appMode) {
    case 'Meeting':
      mode = (
        <Stack.Screen
          name="Meeting"
          component={Meeting}
          options={{ headerShown: false }}
        />
      );
      break;
    case 'Call':
      mode = (
        <Stack.Screen
          name="Call"
          component={Call}
          options={{ headerShown: false }}
        />
      );
      break;
    case 'None':
      mode = (
        <Stack.Screen
          name="ChooseAppMode"
          component={AppMode}
          options={{ headerShown: false }}
        />
      );
      break;
  }

  useEffect(() => {
    if (!(username && userImageUrl)) {
      return;
    }
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setState({ appMode: 'Meeting' });
      }
    });

    return () => subscription.unsubscribe();
  }, [setState, username, userImageUrl]);

  useEffect(() => {
    if (username && userImageUrl) {
      StaticNavigationService.authenticationInfo = {
        username,
        userImageUrl,
      };
    }
  }, [username, userImageUrl]);

  if (!(username && userImageUrl)) {
    return <LoginScreen />;
  }

  return (
    <VideoWrapper>
      <ChatWrapper>
        <Stack.Navigator>{mode}</Stack.Navigator>
      </ChatWrapper>
    </VideoWrapper>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppGlobalContextProvider>
        <NavigationContainer ref={navigationRef}>
          <StackNavigator />
        </NavigationContainer>
      </AppGlobalContextProvider>
    </SafeAreaProvider>
  );
}
