import {
  useCalls,
  StreamCall,
  RingingCallContent,
  CallingState,
  Call,
} from '@stream-io/video-react-native-sdk';
import { useEffect } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function JoinRingingCallScreen() {
  const calls = useCalls().filter((c) => c.ringing);

  useEffect(() => {
    if (calls.length > 1) {
      const lastCall = calls[calls.length - 1];
      Alert.alert(
        `More than 1 active ringing call at a time is not supported in the app, last call details -- id: ${lastCall.id}`,
      );
    }
  }, [calls]);

  const firstCall = calls[0];

  useEffect(() => {
    if (!firstCall) {
      router.back();
    }
  }, [firstCall]);

  if (!firstCall) {
    return null;
  }

  return (
    <StreamCall call={firstCall}>
      <CallLeaveOnUnmount call={firstCall} />
      <SafeAreaView style={styles.flexedContainer}>
        <RingingCallContent />
      </SafeAreaView>
    </StreamCall>
  );
}

const CallLeaveOnUnmount = ({ call }: { call: Call }) => {
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

const styles = StyleSheet.create({
  flexedContainer: {
    flex: 1,
  },
});
