import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LiveStreamAudioControlButton } from './LiveStreamAudioControlButton';
import { LiveStreamVideoControlButton } from './LiveStreamVideoControlButton';

/**
 * Props for the LiveStreamMediaControls component.
 */
export type LiveStreamMediaControlsProps = {};

/**
 * The LiveStreamMediaControls component controls the media publish/unpublish for the host's live stream.
 */
export const LiveStreamMediaControls = ({}: LiveStreamMediaControlsProps) => {
  return (
    <View style={[styles.container]}>
      <LiveStreamAudioControlButton />
      <LiveStreamVideoControlButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
