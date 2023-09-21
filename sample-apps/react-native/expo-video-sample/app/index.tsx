import React, { useEffect } from 'react';
import { StyleSheet, Alert, PermissionsAndroid, Platform } from 'react-native';
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
import * as Notifications from 'expo-notifications';

export default function JoinCallScreen() {
  const calls = useCalls();

  useEffect(() => {
    const run = async () => {
      if (Platform.OS === 'android') {
        await Notifications.requestPermissionsAsync();
        if (Platform.Version > 30) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          );
        }
      }
    };
    run();
  }, []);

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
      {firstCall.ringing ? (
        <SafeAreaView style={styles.flexedContainer}>
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
    <>
      <NavigationHeader />
      <SafeAreaView style={styles.createCallContainer}>
        <CreateMeetingCall />
        <CreateRingingCall />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  createCallContainer: {
    margin: 16,
  },
  flexedContainer: {
    flex: 1,
  },
});
