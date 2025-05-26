import {
  HangUpCallButton,
  ReactionsButton,
  ToggleAudioPublishingButton,
  ToggleCameraFaceButton,
  ToggleVideoPublishingButton,
  ScreenShareToggleButton,
  CallControlProps,
  CallControlsButton,
  useNoiseCancellation,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Hearing from '../assets/Hearing';

const NoiseCancellationButton = () => {
  const {
    isEnabled,
    setEnabled,
    isSupported,
    deviceSupportsAdvancedAudioProcessing,
  } = useNoiseCancellation();

  if (!isSupported || !deviceSupportsAdvancedAudioProcessing) {
    return null;
  }

  return (
    <CallControlsButton onPress={() => setEnabled(!isEnabled)}>
      <View style={styles.iconWrapper}>
        <Hearing color="#fff" enabled={isEnabled} />
      </View>
    </CallControlsButton>
  );
};
export const CallControlsComponent = ({ landscape }: CallControlProps) => {
  const { bottom } = useSafeAreaInsets();
  const landscapeStyles: ViewStyle = {
    flexDirection: landscape ? 'column-reverse' : 'row',
    paddingHorizontal: landscape ? 12 : 0,
    paddingVertical: landscape ? 0 : 12,
    paddingBottom: landscape ? 0 : Math.max(bottom, 16),
  };

  return (
    <View style={[styles.callControlsWrapper, landscapeStyles]}>
      <ReactionsButton />
      <ScreenShareToggleButton />
      <ToggleVideoPublishingButton />
      <ToggleAudioPublishingButton />
      <ToggleCameraFaceButton />
      <HangUpCallButton />
      <NoiseCancellationButton />
    </View>
  );
};

const styles = StyleSheet.create({
  callControlsWrapper: {
    justifyContent: 'space-evenly',
    zIndex: 1,
    backgroundColor: '#272A30',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});
