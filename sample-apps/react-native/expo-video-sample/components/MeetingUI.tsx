import React, { useEffect } from 'react';
import {
  CallContent,
  CallingState,
  Lobby,
  NoiseCancellationProvider,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProgressLoader } from './AuthProgressLoader';
import { StyleSheet } from 'react-native';
import { CallControlsComponent } from './CallControlsComponent';

export const MeetingUI = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const call = useCall();

  // Leave the call if the call is not left and the component is unmounted.
  useEffect(() => {
    return () => {
      if (call && call.state.callingState !== CallingState.LEFT) {
        call.leave();
      }
    };
  }, [call]);

  if (callingState === CallingState.IDLE) {
    return <Lobby />;
  } else if (callingState === CallingState.JOINING) {
    return <AuthProgressLoader />;
  }
  return (
    <SafeAreaView style={styles.container}>
      <NoiseCancellationProvider>
        <CallContent
          CallControls={CallControlsComponent}
          iOSPiPIncludeLocalParticipantVideo={true}
        />
      </NoiseCancellationProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
