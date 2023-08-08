import React, { useCallback, useEffect } from 'react';
import JoinCallScreen from '../screens/Call/JoinCallScreen';

import {
  CallingState,
  IncomingCall,
  OutgoingCall,
  StreamCall,
  useCall,
  useCallCallingState,
  useCalls,
} from '@stream-io/video-react-native-sdk';
import { Alert, StyleSheet, View } from 'react-native';
import { ActiveCall } from '../components/ActiveCall';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CallStackParamList } from '../../types';
import { NavigationHeader } from '../components/NavigationHeader';
import { appTheme } from '../theme';
import { AuthenticationProgress } from '../components/AuthenticatingProgress';

const CallStack = createNativeStackNavigator<CallStackParamList>();

const CallPanel = () => {
  const call = useCall();
  const isCallCreatedByMe = call?.data?.created_by.id === call?.currentUserId;

  const callingState = useCallCallingState();

  switch (callingState) {
    case CallingState.RINGING:
      return isCallCreatedByMe ? (
        <View style={styles.container}>
          <OutgoingCall />
        </View>
      ) : (
        <IncomingCall />
      );
    case CallingState.JOINED:
      return (
        <View style={styles.container}>
          <ActiveCall />
        </View>
      );
    case CallingState.JOINING:
      return (
        <View style={styles.container}>
          <AuthenticationProgress />
        </View>
      );
    default:
      return null;
  }
};

const Calls = () => {
  const calls = useCalls();

  const handleMoreCalls = useCallback(async () => {
    const lastCallCreatedBy = calls[1].data?.created_by;
    Alert.alert(
      `Incoming call from ${
        lastCallCreatedBy?.name ?? lastCallCreatedBy?.id
      }, only 1 call at a time is supported`,
    );
  }, [calls]);

  // Reset the state of the show variable when there are no calls.
  useEffect(() => {
    if (calls.length > 1) {
      handleMoreCalls();
    }
  }, [calls.length, handleMoreCalls]);

  const firstCall = calls[0];

  if (!firstCall) {
    return null;
  }

  return (
    <StreamCall call={firstCall}>
      <CallPanel />
    </StreamCall>
  );
};

export const Call = () => {
  return (
    <>
      <CallStack.Navigator>
        <CallStack.Screen
          name="JoinCallScreen"
          component={JoinCallScreen}
          options={{ header: NavigationHeader }}
        />
      </CallStack.Navigator>
      <Calls />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: appTheme.colors.static_grey,
  },
});
