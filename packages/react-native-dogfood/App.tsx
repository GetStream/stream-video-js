import * as React from 'react';
import { useEffect, useState } from 'react';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {
  LoginStackParamList,
  MeetingStackParamList,
  RingingStackParamList,
  RootStackParamList,
} from './types';
import LoginScreen from './src/screens/LoginScreen';
import { NavigationHeader } from './src/components/NavigationHeader';
import { useAuth } from './src/hooks/useAuth';
import AuthenticatingProgressScreen from './src/screens/AuthenticatingProgress';
import {
  prontoCallId$,
  useProntoLinkEffect,
} from './src/hooks/useProntoLinkEffect';
import {
  IncomingCallView,
  LobbyView,
  OutgoingCallView,
  StreamCallProvider,
  StreamVideo,
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
import { CallParticipantsInfoScreen } from './src/screens/Meeting/CallParticipantsInfoScreen';
import {
  setFirebaseHandler,
  setForegroundService,
} from './src/modules/push/android';
import { useIosPushEffect } from './src/hooks/useIosPushEffect';
import { Platform } from 'react-native';
import { useCallKeepEffect } from './src/hooks/useCallkeepEffect';
import { navigationRef } from './src/utils/staticNavigationUtils';

import Logger from 'react-native-webrtc/src/Logger';
import { Call } from '@stream-io/video-client';

// @ts-expect-error
Logger.enable(false);

const Stack = createNativeStackNavigator<RootStackParamList>();
const LoginStack = createNativeStackNavigator<LoginStackParamList>();
const MeetingStack = createNativeStackNavigator<MeetingStackParamList>();
const RingingStack = createNativeStackNavigator<RingingStackParamList>();

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
        name="LobbyViewScreen"
        component={LobbyView}
        options={{ headerShown: false }}
      />
      <MeetingStack.Screen
        name="MeetingScreen"
        component={MeetingScreen}
        options={{ headerShown: false }}
      />
      <MeetingStack.Screen
        name="CallParticipantsInfoScreen"
        component={CallParticipantsInfoScreen}
      />
    </MeetingStack.Navigator>
  );
};

const Ringing = () => {
  return (
    <RingingStack.Navigator>
      <RingingStack.Screen
        name="JoinCallScreen"
        component={JoinCallScreen}
        options={{ header: NavigationHeader }}
      />
      <RingingStack.Screen
        name="CallScreen"
        component={CallScreen}
        options={{ headerShown: false }}
      />
      <RingingStack.Screen
        name="IncomingCallScreen"
        component={IncomingCallView}
        options={{ headerShown: false }}
      />
      <RingingStack.Screen
        name="OutgoingCallScreen"
        component={OutgoingCallView}
        options={{ headerShown: false }}
      />
      <MeetingStack.Screen
        name="CallParticipantsInfoScreen"
        component={CallParticipantsInfoScreen}
      />
    </RingingStack.Navigator>
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
  useProntoLinkEffect();
  const { authenticationInProgress, videoClient } = useAuth();
  const appMode = useAppGlobalStoreValue((store) => store.appMode);
  const callNavigation =
    useNavigation<NativeStackNavigationProp<RingingStackParamList>>();
  const meetingNavigation =
    useNavigation<NativeStackNavigationProp<MeetingStackParamList>>();

  const onActiveCall = React.useCallback(() => {
    if (appMode === 'Meeting') {
      meetingNavigation.navigate('MeetingScreen');
    } else {
      callNavigation.navigate('CallScreen');
    }
  }, [appMode, callNavigation, meetingNavigation]);

  const onIncomingCall = React.useCallback(() => {
    callNavigation.navigate('IncomingCallScreen');
  }, [callNavigation]);

  const onOutgoingCall = React.useCallback(() => {
    callNavigation.navigate('OutgoingCallScreen');
  }, [callNavigation]);

  const onHangupCall = React.useCallback(() => {
    if (appMode === 'Meeting') {
      meetingNavigation.navigate('JoinMeetingScreen');
    } else {
      callNavigation.navigate('JoinCallScreen');
    }
  }, [appMode, callNavigation, meetingNavigation]);

  const onRejectCall = React.useCallback(() => {
    callNavigation.navigate('JoinCallScreen');
  }, [callNavigation]);

  const callCycleHandlers = React.useMemo(() => {
    return {
      onActiveCall,
      onIncomingCall,
      onOutgoingCall,
      onHangupCall,
      onRejectCall,
    };
  }, [
    onActiveCall,
    onIncomingCall,
    onOutgoingCall,
    onHangupCall,
    onRejectCall,
  ]);

  useIosPushEffect();
  useCallKeepEffect();

  const setState = useAppGlobalStoreSetState();
  const callId = useAppGlobalStoreValue((store) => store.callId);
  const callType = useAppGlobalStoreValue((store) => store.callType);
  const [call, setCall] = useState<Call>();

  useEffect(() => {
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setState({
          callId: prontoCallId,
        });
        prontoCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
      }
    });
    return () => subscription.unsubscribe();
  }, [setState]);

  useEffect(() => {
    if (!callId || !callType || !videoClient) {
      return;
    }
    const newCall = videoClient.call(callType, callId);
    setCall(newCall);

    return () => {
      newCall.leave().catch((e) => console.log(e));
    };
  }, [callId, callType, videoClient]);

  if (authenticationInProgress) {
    return <AuthenticatingProgressScreen />;
  }

  if (!videoClient) {
    return <Login />;
  }

  return (
    <StreamVideo client={videoClient} callCycleHandlers={callCycleHandlers}>
      {/*
        <StreamCallProvider /> shouldn't be embedded in <StreamVideo />
        as otherwise it becomes hard to support multiple calls
        (call-watching scenario). eg: Audio Rooms use-case.
      */}
      <StreamCallProvider call={call}>
        <Stack.Navigator>
          {appMode === 'Meeting' ? (
            <Stack.Screen
              name="Meeting"
              component={Meeting}
              options={{ headerShown: false }}
            />
          ) : appMode === 'Ringing' ? (
            <Stack.Screen
              name="Ringing"
              component={Ringing}
              options={{ headerShown: false }}
            />
          ) : null}
        </Stack.Navigator>
      </StreamCallProvider>
    </StreamVideo>
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
