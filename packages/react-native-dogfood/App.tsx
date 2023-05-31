import * as React from 'react';
import { useEffect } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {
  LoginStackParamList,
  MeetingStackParamList,
  CallStackParamList,
  RootStackParamList,
} from './types';
import LoginScreen from './src/screens/LoginScreen';
import { NavigationHeader } from './src/components/NavigationHeader';
import {
  prontoCallId$,
  useProntoLinkEffect,
} from './src/hooks/useProntoLinkEffect';
import {
  IncomingCallView,
  OutgoingCallView,
} from '@stream-io/video-react-native-sdk';
import {
  AppGlobalContextProvider,
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from './src/contexts/AppContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MeetingScreen } from './src/screens/Meeting/MeetingScreen';
import { CallScreen } from './src/screens/Call/CallScreen';
import JoinMeetingScreen from './src/screens/Meeting/JoinMeetingScreen';
import JoinCallScreen from './src/screens/Call/JoinCallScreen';
import { ChooseFlowScreen } from './src/screens/ChooseFlowScreen';
import {
  setFirebaseHandler,
  setForegroundService,
} from './src/modules/push/android';
import { useIosPushEffect } from './src/hooks/useIosPushEffect';
import { Platform } from 'react-native';
import { useCallKeepEffect } from './src/hooks/useCallkeepEffect';
import { navigationRef } from './src/utils/staticNavigationUtils';

import Logger from 'react-native-webrtc/src/Logger';
import { GuestModeScreen } from './src/screens/Meeting/GuestModeScreen';
import { GuestMeetingScreen } from './src/screens/Meeting/GuestMeetingScreen';

// @ts-expect-error
Logger.enable(false);

const Stack = createNativeStackNavigator<RootStackParamList>();
const LoginStack = createNativeStackNavigator<LoginStackParamList>();
const MeetingStack = createNativeStackNavigator<MeetingStackParamList>();
const CallStack = createNativeStackNavigator<CallStackParamList>();

if (Platform.OS === 'android') {
  setFirebaseHandler();
  setForegroundService();
}

const Meeting = () => {
  return (
    <MeetingStack.Navigator>
      <MeetingStack.Screen
        name="JoinMeetingScreen"
        component={JoinMeetingScreen}
        options={{ header: NavigationHeader }}
      />
      <MeetingStack.Screen
        name="MeetingScreen"
        component={MeetingScreen}
        options={{ headerShown: false }}
      />
      <MeetingStack.Screen
        name="GuestModeScreen"
        component={GuestModeScreen}
        options={{ headerShown: false }}
      />
      <MeetingStack.Screen
        name="GuestMeetingScreen"
        component={GuestMeetingScreen}
        options={{ headerShown: false }}
      />
    </MeetingStack.Navigator>
  );
};

const Call = () => {
  return (
    <CallStack.Navigator>
      <CallStack.Screen
        name="JoinCallScreen"
        component={JoinCallScreen}
        options={{ header: NavigationHeader }}
      />
      <CallStack.Screen
        name="CallScreen"
        component={CallScreen}
        options={{ headerShown: false }}
      />
      <CallStack.Screen
        name="IncomingCallScreen"
        component={IncomingCallView}
        options={{ headerShown: false }}
      />
      <CallStack.Screen
        name="OutgoingCallScreen"
        component={OutgoingCallView}
        options={{ headerShown: false }}
      />
    </CallStack.Navigator>
  );
};

const Login = () => {
  const setState = useAppGlobalStoreSetState();
  const loginNavigation =
    useNavigation<NativeStackNavigationProp<LoginStackParamList>>();
  React.useEffect(() => {
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setState({ appMode: 'Meeting' });
        loginNavigation.navigate('LoginScreen');
      }
    });
    return () => subscription.unsubscribe();
  }, [setState, loginNavigation]);
  return (
    <LoginStack.Navigator>
      <LoginStack.Screen
        name="ChooseFlowScreen"
        component={ChooseFlowScreen}
        options={{ headerShown: false }}
      />
      <LoginStack.Screen
        name="LoginScreen"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </LoginStack.Navigator>
  );
};

const StackNavigator = () => {
  const appMode = useAppGlobalStoreValue((store) => store.appMode);
  const username = useAppGlobalStoreValue((store) => store.username);
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const setState = useAppGlobalStoreSetState();
  // const callNavigation =
  //   useNavigation<NativeStackNavigationProp<CallStackParamList>>();
  const meetingNavigation =
    useNavigation<NativeStackNavigationProp<MeetingStackParamList>>();

  // const setRandomCallId = React.useCallback(() => {
  //   setState({
  //     callId: uuidv4().toLowerCase(),
  //   });
  // }, [setState]);
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

    // if (appMode === 'Call') {
    //   setRandomCallId();
    // }

    return () => subscription.unsubscribe();
  }, [
    appMode,
    // setRandomCallId,
    setState,
    meetingNavigation,
  ]);

  // const onCallJoined = React.useCallback(() => {
  //   callNavigation.navigate('CallScreen');
  // }, [callNavigation]);

  // const onCallIncoming = React.useCallback(() => {
  //   callNavigation.navigate('IncomingCallScreen');
  // }, [callNavigation]);

  // const onCallOutgoing = React.useCallback(() => {
  //   callNavigation.navigate('OutgoingCallScreen');
  // }, [callNavigation]);

  // const onCallHungUp = React.useCallback(() => {
  //   callNavigation.navigate('JoinCallScreen');
  //   setRandomCallId();
  // }, [callNavigation, setRandomCallId]);

  // const onCallRejected = React.useCallback(() => {
  //   callNavigation.navigate('JoinCallScreen');
  //   setRandomCallId();
  // }, [callNavigation, setRandomCallId]);

  // const callCycleHandlers = React.useMemo(() => {
  //   return {
  //     onCallJoined,
  //     onCallIncoming,
  //     onCallOutgoing,
  //     onCallHungUp,
  //     onCallRejected,
  //   };
  // }, [
  //   onCallJoined,
  //   onCallIncoming,
  //   onCallOutgoing,
  //   onCallHungUp,
  //   onCallRejected,
  // ]);

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
