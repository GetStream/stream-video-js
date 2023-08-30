import React from 'react';
import {
  CallContent,
  CallingState,
  Lobby,
  StreamVideoRN,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProgressLoader } from './AuthProgressLoader';
import { StyleSheet } from 'react-native';

export const MeetingUI = () => {
  const router = useRouter();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  StreamVideoRN.setPermissions({
    isCameraPermissionGranted: true,
    isMicPermissionGranted: true,
  });

  const onHangupCallHandler = () => {
    router.back();
  };

  if (callingState === CallingState.IDLE) {
    return <Lobby />;
  } else if (callingState === CallingState.JOINING) {
    return <AuthProgressLoader />;
  }
  return (
    <SafeAreaView style={styles.container}>
      <CallContent onHangupCallHandler={onHangupCallHandler} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
