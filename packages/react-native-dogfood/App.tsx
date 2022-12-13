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
import { PermissionsAndroid } from 'react-native';
import { MeetingScreen } from './src/screens/Meeting/MeetingScreen';
import { CallScreen } from './src/screens/Call/CallScreen';
import JoinMeetingScreen from './src/screens/Meeting/JoinMeetingScreen';
import JoinCallScreen from './src/screens/Call/JoinCallScreen';
import { ChooseFlowScreen } from './src/screens/ChooseFlowScreen';
import IncomingCallScreen from './src/screens/IncomingCallScreen';
import OutgoingCallScreen from './src/screens/OutgoingCallScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const MeetingStack = createNativeStackNavigator<MeetingStackParamList>();
const RingingStack = createNativeStackNavigator<RingingStackParamList>();

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
    </MeetingStack.Navigator>
  );
};

const Ringing = (props: NativeStackScreenProps<RingingStackParamList>) => {
  const username = useAppGlobalStoreValue((store) => store.username);
  const ringingCallID = useAppGlobalStoreValue((store) => store.ringingCallID);
  const ringingUsers = useAppGlobalStoreValue((store) => store.ringingUsers);
  const { navigation } = props;

  return (
    <StreamCall
      currentUser={username}
      callId={ringingCallID}
      callType={'default'}
      autoJoin={true}
      input={{ ring: true, members: ringingUsers }}
      onIncomingCall={() => navigation.navigate('IncomingCallScreen')}
      onOutgoingCall={() => navigation.navigate('OutgoingCallScreen')}
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
      </RingingStack.Navigator>
    </StreamCall>
  );
};

const StackNavigator = () => {
  useProntoLinkEffect();
  const { authenticationInProgress, videoClient } = useAuth();
  const appMode = useAppGlobalStoreValue((store) => store.appMode);

  if (authenticationInProgress) {
    return <AuthenticatingProgressScreen />;
  }
  if (!videoClient) {
    return <LoginScreen />;
  }
  return (
    <StreamVideo callKeepOptions={callKeepOptions} client={videoClient}>
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
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </AppGlobalContextProvider>
    </SafeAreaProvider>
  );
}
