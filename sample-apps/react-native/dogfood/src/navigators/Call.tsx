import React, { useCallback, useEffect } from 'react';
import JoinCallScreen from '../screens/Call/JoinCallScreen';

import {
  RingingCallContent,
  StreamCall,
  useCalls,
} from '@stream-io/video-react-native-sdk';
import { Alert, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CallStackParamList } from '../../types';
import { NavigationHeader } from '../components/NavigationHeader';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const CallStack = createNativeStackNavigator<CallStackParamList>();

const Calls = () => {
  const calls = useCalls();
  const { top } = useSafeAreaInsets();

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
    <StreamCall
      call={firstCall}
      mediaDeviceInitialState={{
        initialAudioEnabled: false,
        initialVideoEnabled: false,
      }}
    >
      <SafeAreaView style={[styles.container, { top }]}>
        <RingingCallContent />
      </SafeAreaView>
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
  },
});
