import * as React from 'react';
import { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { MeetingStackParamList, RootStackParamList } from './types';
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
  setFirebaseHandler,
  setForegroundService,
} from './src/modules/push/android';
import { useIosPushEffect } from './src/hooks/useIosPushEffect';
import { Platform } from 'react-native';
import { useCallKeepEffect } from './src/hooks/useCallkeepEffect';
import { navigationRef } from './src/utils/staticNavigationUtils';
import Logger from 'react-native-webrtc/src/Logger';
import { Meeting } from './src/navigators/Meeting';
import { Call } from './src/navigators/Call';
import { Login } from './src/navigators/Login';

// @ts-expect-error
Logger.enable(false);

const Stack = createNativeStackNavigator<RootStackParamList>();

if (Platform.OS === 'android') {
  setFirebaseHandler();
  setForegroundService();
}

const StackNavigator = () => {
  const appMode = useAppGlobalStoreValue((store) => store.appMode);
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const setState = useAppGlobalStoreSetState();
  const meetingNavigation =
    useNavigation<NativeStackNavigationProp<MeetingStackParamList>>();

  useProntoLinkEffect();
  useIosPushEffect();
  useCallKeepEffect();

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
  }

  useEffect(() => {
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        meetingNavigation.navigate('MeetingScreen', { callId: prontoCallId });
        prontoCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
      }
    });

    return () => subscription.unsubscribe();
  }, [appMode, setState, meetingNavigation]);

  if (!(username && userImageUrl)) {
    return <Login />;
  }

  return <Stack.Navigator>{mode}</Stack.Navigator>;
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
