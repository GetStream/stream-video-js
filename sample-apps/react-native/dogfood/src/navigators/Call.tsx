import React, { useCallback, useEffect } from 'react';
import JoinCallScreen from '../screens/Call/JoinCallScreen';

import {
  CallingState,
  RingingCallContent,
  StreamCall,
  useCalls,
  Call as StreamCallType,
} from '@stream-io/video-react-native-sdk';
import { Alert, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CallStackParamList } from '../../types';
import { NavigationHeader } from '../components/NavigationHeader';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useOrientation } from '../hooks/useOrientation';

const CallStack = createNativeStackNavigator<CallStackParamList>();

const Calls = () => {
  const calls = useCalls().filter((c) => c.ringing);
  const { top } = useSafeAreaInsets();
  const orientation = useOrientation();

  const handleMoreCalls = useCallback(async () => {
    const lastCallCreatedBy = calls[1]?.state.createdBy;
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
      <CallLeaveOnUnmount call={firstCall} />
      <SafeAreaView style={[styles.container, { top }]}>
        <RingingCallContent landscape={orientation === 'landscape'} />
      </SafeAreaView>
    </StreamCall>
  );
};

const CallLeaveOnUnmount = ({ call }: { call: StreamCallType }) => {
  useEffect(() => {
    return () => {
      if (call && call.state.callingState !== CallingState.LEFT) {
        call.leave();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
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
  },
});
