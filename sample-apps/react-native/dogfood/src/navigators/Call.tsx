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
import { CallStackParamList, RootStackParamList } from '../../types';
import { NavigationHeader } from '../components/NavigationHeader';
import { useOrientation } from '../hooks/useOrientation';
import { ActiveCall } from '../components/ActiveCall';
import { LayoutProvider } from '../contexts/LayoutContext';
import { createNavigationContainerRef } from '@react-navigation/native';

const CallStack = createNativeStackNavigator<CallStackParamList>();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

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

const CallLeaveOnUnmount = ({ call }: { call: StreamCallType }) => {
  useEffect(() => {
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
