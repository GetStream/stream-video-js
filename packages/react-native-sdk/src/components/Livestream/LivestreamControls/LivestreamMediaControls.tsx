import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../contexts';
import { LivestreamAudioControlButton } from './LivestreamAudioControlButton';
import { LivestreamVideoControlButton } from './LivestreamVideoControlButton';

/**
 * Props for the LivestreamMediaControls component.
 */
export type LivestreamMediaControlsProps = {};

/**
 * The LivestreamMediaControls component controls the media publish/unpublish for the host's live stream.
 */
export const LivestreamMediaControls = ({}: LivestreamMediaControlsProps) => {
  const {
    theme: { liveStreamMediaControls },
  } = useTheme();
  return (
    <View style={[styles.container, liveStreamMediaControls.container]}>
      <LivestreamAudioControlButton />
      <LivestreamVideoControlButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
