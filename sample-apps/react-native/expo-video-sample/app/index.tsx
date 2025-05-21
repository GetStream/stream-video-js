import React, { useEffect } from 'react';
import {
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import {
  isExpoNotificationStreamVideoEvent,
  oniOSExpoNotificationEvent,
  useCalls,
} from '@stream-io/video-react-native-sdk';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { NavigationHeader } from '../components/NavigationHeader';
import CreateMeetingCall from '../components/CreateMeetingCall';
import CreateRingingCall from '../components/CreateRingingCall';

export default function CreateCallScreen() {
  useEffect(() => {
    const requestPermissions = async () => {
      await Notifications.requestPermissionsAsync();
      if (Platform.OS === 'android') {
        if (Platform.Version > 30) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          );
        }
      }
    };
    requestPermissions();

    if (Platform.OS === 'ios') {
      // This listener is fired whenever a notification is received while the app is foregrounded.
      // here the notification payload is processed and the call is added to the low level client state
      const subscription = Notifications.addNotificationReceivedListener(
        (notification) => {
          if (isExpoNotificationStreamVideoEvent(notification)) {
            oniOSExpoNotificationEvent(notification);
          }
        },
      );
      return () => {
        subscription.remove();
      };
    }
  }, []);

  const calls = useCalls().filter((c) => c.ringing);

  useEffect(() => {
    if (calls.length) {
      if (calls.length > 1) {
        const lastCall = calls[calls.length - 1];
        Alert.alert(
          `More than 1 active ringing call at a time is not supported in the app, last call details -- id: ${lastCall.id}`,
        );
      } else {
        router.push('/ringing');
      }
    }
  }, [calls]);

  useEffect(() => {
    if (calls.length === 1) {
    }
  }, [calls]);

  return (
    <KeyboardAvoidingView
      style={styles.flexedContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <NavigationHeader />
      <SafeAreaView style={styles.createCallContainer}>
        <ScrollView>
          <CreateMeetingCall />
          <CreateRingingCall />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  createCallContainer: {
    margin: 16,
    flex: 1,
  },
  flexedContainer: {
    flex: 1,
  },
});
