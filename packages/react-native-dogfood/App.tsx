import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  MeetingStackParamList,
  RingingStackParamList,
  RootStackParamList,
} from './types';
import LoginScreen from './src/screens/LoginScreen';
import { NavigationHeader } from './src/components/NavigationHeader';
import { useAuth } from './src/hooks/useAuth';
import AuthenticatingProgressScreen from './src/screens/AuthenticatingProgress';
import { useProntoLinkEffect } from './src/hooks/useProntoLinkEffect';
import { StreamCall, StreamVideo } from '@stream-io/video-react-native-sdk';
import {
  AppGlobalContextProvider,
  useAppGlobalStoreValue,
} from './src/contexts/AppContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MeetingScreen } from './src/screens/Meeting/MeetingScreen';
import { CallScreen } from './src/screens/Call/CallScreen';
import JoinMeetingScreen from './src/screens/Meeting/JoinMeetingScreen';
import JoinCallScreen from './src/screens/Call/JoinCallScreen';
import { ChooseFlowScreen } from './src/screens/ChooseFlowScreen';
import IncomingCallScreen from './src/screens/Call/IncomingCallScreen';
import OutgoingCallScreen from './src/screens/Call/OutgoingCallScreen';
import { StreamMeeting } from '@stream-io/video-react-native-sdk/src/components/StreamMeeting';
import { CallParticipansInfoScreen } from './src/screens/Meeting/CallParticipantsInfoScreen';
import { setFirebaseHandler } from './src/modules/push/android';
import { useIosPushEffect } from './src/hooks/useIosPushEffect';
import { Platform } from 'react-native';
import { useCallKeepEffect } from './src/hooks/useCallkeepEffect';
import { navigationRef } from './src/utils/staticNavigationUtils';

import Logger from 'react-native-webrtc/src/Logger';

// @ts-expect-error
Logger.enable(false);

const Stack = createNativeStackNavigator<RootStackParamList>();
const MeetingStack = createNativeStackNavigator<MeetingStackParamList>();
const RingingStack = createNativeStackNavigator<RingingStackParamList>();

if (Platform.OS === 'android') {
  setFirebaseHandler();
}

const Meeting = (props: NativeStackScreenProps<MeetingStackParamList>) => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const meetingCallID = useAppGlobalStoreValue((store) => store.meetingCallID);
  const { navigation } = props;

  return (
    <StreamMeeting
      currentUser={username}
      callId={meetingCallID}
      callType={'default'}
      autoJoin={true}
      onActiveCall={() => navigation.navigate('MeetingScreen')}
    >
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
          name="CallParticipantsInfoScreen"
          component={CallParticipansInfoScreen}
        />
      </MeetingStack.Navigator>
    </StreamMeeting>
  );
};

const Ringing = (props: NativeStackScreenProps<RingingStackParamList>) => {
  const { navigation } = props;

  return (
    <StreamCall
      onIncomingCall={() => navigation.navigate('IncomingCallScreen')}
      onOutgoingCall={() => navigation.navigate('OutgoingCallScreen')}
      onHangupCall={() => navigation.navigate('JoinCallScreen')}
      onAcceptCall={() => navigation.navigate('CallScreen')}
    >
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
          component={IncomingCallScreen}
          options={{ headerShown: false }}
        />
        <RingingStack.Screen
          name="OutgoingCallScreen"
          component={OutgoingCallScreen}
          options={{ headerShown: false }}
        />
        <MeetingStack.Screen
          name="CallParticipantsInfoScreen"
          component={CallParticipansInfoScreen}
        />
      </RingingStack.Navigator>
    </StreamCall>
  );
};

const StackNavigator = () => {
  useProntoLinkEffect();
  const { authenticationInProgress, videoClient } = useAuth();
  const appMode = useAppGlobalStoreValue((store) => store.appMode);

  useIosPushEffect();
  useCallKeepEffect();

  if (authenticationInProgress) {
    return <AuthenticatingProgressScreen />;
  }
  if (!videoClient) {
    return <LoginScreen />;
  }
  return (
    <StreamVideo client={videoClient}>
      <Stack.Navigator>
        {appMode === 'None' ? (
          <Stack.Screen
            name="ChooseFlowScreen"
            component={ChooseFlowScreen}
            options={{ headerShown: false }}
          />
        ) : appMode === 'Meeting' ? (
          <Stack.Screen
            name="Meeting"
            component={Meeting}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="Ringing"
            component={Ringing}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
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
