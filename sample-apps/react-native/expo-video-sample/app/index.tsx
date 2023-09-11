import React, { useEffect } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { NavigationHeader } from '../components/NavigationHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateMeetingCall from '../components/CreateMeetingCall';
import CreateRingingCall from '../components/CreateRingingCall';
import {
  RingingCallContent,
  StreamCall,
  useCalls,
} from '@stream-io/video-react-native-sdk';
import { MeetingUI } from '../components/MeetingUI';

export default function JoinCallScreen() {
  const calls = useCalls();

  useEffect(() => {
    if (calls.length > 1) {
      const lastCall = calls[calls.length - 1];
      Alert.alert(
        `More than 1 active call at a time is not supported in the app, last call details -- id: ${lastCall.id} ringing: ${lastCall.ringing}`,
      );
    }
  }, [calls]);

  const firstCall = calls[0];

  if (!firstCall) {
    return <CreateCallScreen />;
  }

  return (
    <StreamCall
      call={firstCall}
      mediaDeviceInitialState={{
        initialAudioEnabled: false,
        initialVideoEnabled: false,
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      {firstCall.ringing ? (
        <SafeAreaView style={styles.ringingCallContainer}>
          <RingingCallContent />
        </SafeAreaView>
      ) : (
        <MeetingUI />
      )}
    </StreamCall>
  );
}

const CreateCallScreen = () => {
  return (
    <SafeAreaView style={styles.createCallContainer}>
      <Stack.Screen
        options={{
          header: () => <NavigationHeader />,
        }}
      />
      <CreateMeetingCall />
      <CreateRingingCall />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  createCallContainer: {
    margin: 16,
  },
  ringingCallContainer: {
    flex: 1,
  },
});
