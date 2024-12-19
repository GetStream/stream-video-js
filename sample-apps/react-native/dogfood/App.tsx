import * as React from 'react';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import {
  deeplinkCallId$,
  useDeepLinkEffect,
} from './src/hooks/useDeepLinkEffect';
import {
  AppGlobalContextProvider,
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from './src/contexts/AppContext';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  navigationRef,
  StaticNavigationService,
} from './src/utils/staticNavigationUtils';
import Logger from '@stream-io/react-native-webrtc/src/Logger';
import { Meeting } from './src/navigators/Meeting';
import { Call } from './src/navigators/Call';
import { VideoWrapper } from './src/components/VideoWrapper';
import LoginScreen from './src/screens/LoginScreen';
import AudioRoomScreen from './src/screens/AudioRoom';
import { ChatWrapper } from './src/components/ChatWrapper';
import { AppMode } from './src/navigators/AppMode';
import { setPushConfig } from './src/utils/setPushConfig';
import { useSyncPermissions } from './src/hooks/useSyncPermissions';
import { NavigationHeader } from './src/components/NavigationHeader';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LogBox } from 'react-native';
import { LiveStream } from './src/navigators/Livestream';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {
  defaultTheme,
  isPushNotificationiOSStreamVideoEvent,
  onPushNotificationiOSStreamVideoEvent,
} from '@stream-io/video-react-native-sdk';
import { appTheme } from './src/theme';

// only enable warning and error logs from webrtc library
Logger.enable(`${Logger.ROOT_PREFIX}:(WARN|ERROR)`);

// expo libs are installed for development only in RN SDK
// So linking is not required actually, so we can ignore these warnings
// NOTE: this is not need in integrator's apps as dev dependencies are not installed.
LogBox.ignoreLogs(['expo-modules-core', 'expo-constants']);

const Stack = createNativeStackNavigator<RootStackParamList>();

// All the push notification related config must be done as soon the app starts
// since the app can be opened from a dead state through a push notification
setPushConfig();

const StackNavigator = () => {
  const appMode = useAppGlobalStoreValue((store) => store.appMode);
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const userName = useAppGlobalStoreValue((store) => store.userName);
  const setState = useAppGlobalStoreSetState();
  const { bottom } = useSafeAreaInsets();
  const themeMode = useAppGlobalStoreValue((store) => store.themeMode);
  const color =
    themeMode === 'light'
      ? appTheme.colors.static_white
      : defaultTheme.colors.sheetPrimary;

  useDeepLinkEffect();
  useSyncPermissions();

  useEffect(() => {
    PushNotificationIOS.addEventListener('notification', (notification) => {
      if (isPushNotificationiOSStreamVideoEvent(notification)) {
        onPushNotificationiOSStreamVideoEvent(notification);
      }
    });
    return () => {
      PushNotificationIOS.removeEventListener('notification');
    };
  }, []);

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
    case 'Audio-Room':
      mode = (
        <Stack.Screen
          name="AudioRoom"
          component={AudioRoomScreen}
          options={{ header: NavigationHeader }}
        />
      );
      break;
    case 'LiveStream':
      mode = (
        <Stack.Screen
          name="LiveStream"
          component={LiveStream}
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
    const subscription = deeplinkCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setState({ appMode: 'Meeting' });
      }
    });

    return () => subscription.unsubscribe();
  }, [setState]);

  useEffect(() => {
    if (userId && userImageUrl) {
      StaticNavigationService.authenticationInfo = {
        userId,
        userName,
        userImageUrl,
      };
    }
  }, [userId, userName, userImageUrl]);

  if (!(userId && userImageUrl && userName)) {
    return <LoginScreen />;
  }

  const containerStyle = {
    flex: 1,
    paddingBottom: bottom,
    backgroundColor: color,
  };

  return (
    <GestureHandlerRootView style={containerStyle}>
      <VideoWrapper>
        <ChatWrapper>
          <Stack.Navigator>{mode}</Stack.Navigator>
        </ChatWrapper>
      </VideoWrapper>
    </GestureHandlerRootView>
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
