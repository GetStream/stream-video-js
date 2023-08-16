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
import { StyleSheet } from 'react-native';

// only enable warning and error logs from webrtc library
Logger.enable(`${Logger.ROOT_PREFIX}:(WARN|ERROR)`);

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

  useProntoLinkEffect();
  useSyncPermissions();

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
    if (!(userId && userImageUrl)) {
      return;
    }
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setState({ appMode: 'Meeting' });
      }
    });

    return () => subscription.unsubscribe();
  }, [setState, userId, userImageUrl]);

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

  return (
    <GestureHandlerRootView style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
