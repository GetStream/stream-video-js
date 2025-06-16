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
  useBackgroundFilters,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Hearing from '../assets/Hearing';
import AutoAwesome from '../assets/AutoAwesome';
import { useCustomVideoFilters } from './hooks/useCustomVideoFilters';

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

const BackgroundFiltersButton = () => {
  const { applyGrayScaleFilter, disableCustomFilter, currentCustomFilter } =
    useCustomVideoFilters();

  return (
    <CallControlsButton
      onPress={() =>
        currentCustomFilter === 'GrayScale'
          ? disableCustomFilter()
          : applyGrayScaleFilter()
      }
    >
      <View style={styles.iconWrapper}>
        <AutoAwesome color="#fff" />
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
      <BackgroundFiltersButton />
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
