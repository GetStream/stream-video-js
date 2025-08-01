import React, { useEffect } from 'react';
import {
  CallContent,
  CallingState,
  Lobby,
  NoiseCancellationProvider,
  BackgroundFiltersProvider,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProgressLoader } from './AuthProgressLoader';
import { NativeModules, StyleSheet } from 'react-native';
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
        NativeModules.StreamVideoReactNative?.clearActiveCall(call?.cid);
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
        <BackgroundFiltersProvider>
          <CallContent
            CallControls={CallControlsComponent}
            iOSPiPIncludeLocalParticipantVideo={true}
          />
        </BackgroundFiltersProvider>
      </NoiseCancellationProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
