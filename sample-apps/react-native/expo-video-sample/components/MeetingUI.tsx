import React from 'react';
import {
  CallContent,
  CallingState,
  Lobby,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProgressLoader } from './AuthProgressLoader';
import { StyleSheet } from 'react-native';
import { CallControlsComponent } from './CallControlsComponent';

export const MeetingUI = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  if (callingState === CallingState.IDLE) {
    return <Lobby />;
  } else if (callingState === CallingState.JOINING) {
    return <AuthProgressLoader />;
  }
  return (
    <SafeAreaView style={styles.container}>
      <CallContent CallControls={CallControlsComponent} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
