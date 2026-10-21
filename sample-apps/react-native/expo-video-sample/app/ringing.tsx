import {
  Call,
  CallingState,
  RingingCallContent,
  StreamCall,
  useCalls,
} from '@stream-io/video-react-native-sdk';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CallId } from '../components/CallId';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JoinRingingCallScreen() {
  const calls = useCalls().filter((c) => c.ringing);
  const insets = useSafeAreaInsets();

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
      <View style={styles.flexedContainer}>
        <RingingCallContent insets={insets} />
        <CallId />
      </View>
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
  }, [call]);
  return null;
};

const styles = StyleSheet.create({
  flexedContainer: {
    flex: 1,
  },
});
