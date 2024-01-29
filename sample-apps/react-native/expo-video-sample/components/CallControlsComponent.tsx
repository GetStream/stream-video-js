import {
  HangUpCallButton,
  ReactionsButton,
  ToggleAudioPublishingButton,
  ToggleCameraFaceButton,
  ToggleVideoPublishingButton,
  ScreenShareButton,
  CallControlProps,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
      <ScreenShareButton />
      <ToggleVideoPublishingButton />
      <ToggleAudioPublishingButton />
      <ToggleCameraFaceButton />
      <HangUpCallButton />
    </View>
  );
};

const styles = StyleSheet.create({
  callControlsWrapper: {
    justifyContent: 'space-evenly',
    zIndex: 1,
    backgroundColor: '#272A30',
  },
});
