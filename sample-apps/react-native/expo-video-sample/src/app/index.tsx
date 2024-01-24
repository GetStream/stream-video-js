import React, { useEffect } from 'react';
import {
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { NavigationHeader } from '../components/NavigationHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreateMeetingCall from '../components/CreateMeetingCall';
import CreateRingingCall from '../components/CreateRingingCall';
import * as Notifications from 'expo-notifications';

console.log('CreateCallScreen');

export default function CreateCallScreen() {
  useEffect(() => {
    const run = async () => {
      await Notifications.requestPermissionsAsync();
      if (Platform.OS === 'android') {
        if (Platform.Version > 30) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          );
        }
      }
    };
    run();
  }, []);

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
