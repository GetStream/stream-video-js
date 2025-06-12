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
import { StyleSheet } from 'react-native';
import { CallControlsComponent } from './CallControlsComponent';
import { useCustomVideoFilters } from './hooks/useCustomVideoFilters';

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
        <BackgroundFiltersProvider>
          <FaceBoxDetector />
          <CallContent
            CallControls={CallControlsComponent}
            iOSPiPIncludeLocalParticipantVideo={true}
          />
        </BackgroundFiltersProvider>
      </NoiseCancellationProvider>
    </SafeAreaView>
  );
};

const FaceBoxDetector = () => {
  const { applyFaceBoxDetectorFilter, disableCustomFilter } =
    useCustomVideoFilters();

  // on mount, apply the face box detector filter
  // on unmount, disable the filter
  useEffect(() => {
    applyFaceBoxDetectorFilter();
    return () => {
      disableCustomFilter();
    };
  }, [applyFaceBoxDetectorFilter, disableCustomFilter]);

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
