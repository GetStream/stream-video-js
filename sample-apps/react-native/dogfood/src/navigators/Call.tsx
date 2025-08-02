import React, { useEffect } from 'react';
import JoinCallScreen from '../screens/Call/JoinCallScreen';

import {
  Call as StreamCallType,
  CallingState,
  RingingCallContent,
  StreamCall,
  useCalls,
  StreamVideoRN,
} from '@stream-io/video-react-native-sdk';
import { NativeModules, Platform, StyleSheet } from 'react-native';
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

  const pushConfig = StreamVideoRN.getConfig().push;
  const shouldRejectCallWhenBusy = pushConfig?.shouldRejectCallWhenBusy;

  let joinedCalls = null;
  if (shouldRejectCallWhenBusy && calls.length > 1) {
    joinedCalls = calls.filter(
      (c) => c.state.callingState === CallingState.JOINED,
    );
  }

  const firstCall = joinedCalls ? joinedCalls[0] : calls[0];

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
    if (Platform.OS === 'ios') {
      NativeModules.StreamVideoReactNative?.setActiveCall(false);
    }
    return () => {
      if (call && call.state.callingState !== CallingState.LEFT) {
        call.leave();
      }
    };
  }, [call]);
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
