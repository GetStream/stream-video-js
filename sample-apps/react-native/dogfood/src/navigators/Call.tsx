import React, { useEffect, useCallback } from 'react';
import JoinCallScreen from '../screens/Call/JoinCallScreen';

import {
  Call as StreamCallType,
  CallingState,
  RingingCallContent,
  StreamCall,
  useCalls,
} from '@stream-io/video-react-native-sdk';
import { StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CallStackParamList } from '../../types';
import { NavigationHeader } from '../components/NavigationHeader';
import { useOrientation } from '../hooks/useOrientation';
import { ActiveCall } from '../components/ActiveCall';
import { LayoutProvider } from '../contexts/LayoutContext';
import { attachE2EEIfConfigured, disposeE2EEManager } from '../utils/e2ee';

const CallStack = createNativeStackNavigator<CallStackParamList>();

const Calls = () => {
  const calls = useCalls().filter((c) => c.ringing);
  const orientation = useOrientation();

  const firstCall = calls.at(-1);

  const customCallContent = useCallback(() => {
    return (
      <LayoutProvider>
        <ActiveCall
          onCallEnded={() => {}}
          onHangupCallHandler={() => firstCall?.leave()}
          onChatOpenHandler={null}
        />
      </LayoutProvider>
    );
  }, [firstCall]);

  if (!firstCall) {
    return null;
  }

  return (
    <StreamCall call={firstCall}>
      <AttachE2EEWhileRinging call={firstCall} />
      <CallLeaveOnUnmount call={firstCall} />
      <View style={StyleSheet.absoluteFill}>
        <RingingCallContent
          landscape={orientation === 'landscape'}
          CallContent={customCallContent}
        />
      </View>
    </StreamCall>
  );
};

/**
 * Attaches the E2EE manager while the call is still ringing.
 *
 * The accept button joins inside the SDK and `setE2EEManager` throws once the call
 * has peer connections, so the attach has to happen before the tap. It cannot be
 * moved into the accept handler either: `AcceptCallButton`'s pre-join `onPressHandler`
 * is not reachable through `RingingCallContent`'s props, only the post-join
 * `onAcceptCallHandler` is.
 *
 * Mounting here runs the attach on the render that first surfaces the ringing call.
 * Derivation is `pbkdf2Sync` and the native manager is created synchronously, so it
 * settles a microtask later - long before a finger can land on Accept.
 *
 * Calls accepted from the CallKit/Telecom UI never reach this component; they are
 * covered by the push config's `onBeforeCallJoin` hook instead.
 */
const AttachE2EEWhileRinging = ({ call }: { call: StreamCallType }) => {
  useEffect(() => {
    attachE2EEIfConfigured(call).catch((error) => {
      console.log('Failed to attach E2EE to ringing call:', error);
    });
  }, [call]);
  return null;
};

const CallLeaveOnUnmount = ({ call }: { call: StreamCallType }) => {
  useEffect(() => {
    return () => {
      if (call && call.state.callingState !== CallingState.LEFT) {
        call.leave();
      }
      // No native detach exists, so a manager outlives its call unless released
      // here. Rejected and timed-out calls reach this too, which is the point:
      // they were attached while ringing but never joined.
      disposeE2EEManager(call);
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
