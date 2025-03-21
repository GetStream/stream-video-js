import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RingingCallContent,
  StreamCall,
  useCalls,
} from '@stream-io/video-react-native-sdk';
import { router } from 'expo-router';

export default function Ringing() {
  const calls = useCalls().filter((c) => c.ringing);
  const call = calls[0];

  useEffect(() => {
    if (!call) {
      // redirect to the main app, when the call is removed from the client's call list
      router.replace('/');
    }
  }, [call]);

  if (!call) {
    return null;
  }

  return (
    <StreamCall call={call}>
      <SafeAreaView style={styles.container}>
        <RingingCallContent />
      </SafeAreaView>
    </StreamCall>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
