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
import { ChooseAppModeScreen } from './src/screens/ChooseAppModeScreen';
import { setPushConfig } from './src/utils/setPushConfig';

// @ts-expect-error
Logger.enable(false);

const Stack = createNativeStackNavigator<RootStackParamList>();

// All the push notification related config must be done as soon the app starts
// since the app can be opened from a dead state through a push notification
setPushConfig();

const StackNavigator = () => {
  const appMode = useAppGlobalStoreValue((store) => store.appMode);
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const setState = useAppGlobalStoreSetState();

  useProntoLinkEffect();

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
          component={ChooseAppModeScreen}
          options={{ headerShown: false }}
        />
      );
      break;
  }

  useEffect(() => {
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setState({ appMode: 'Meeting' });
      }
    });

    return () => subscription.unsubscribe();
  }, [setState]);

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
      <Stack.Navigator>{mode}</Stack.Navigator>
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
