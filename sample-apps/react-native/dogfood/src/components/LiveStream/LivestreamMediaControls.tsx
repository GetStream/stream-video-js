import {
  LivestreamAudioControlButton,
  LivestreamVideoControlButton,
  LivestreamScreenShareButton,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Props for the LivestreamMediaControls component.
 */
export type LivestreamMediaControlsProps = {};

/**
 * The LivestreamMediaControls component controls the media publish/unpublish for the host's live stream.
 */
export const LivestreamMediaControls = ({}: LivestreamMediaControlsProps) => {
  return (
    <View style={styles.container}>
      <LivestreamAudioControlButton />
      <LivestreamVideoControlButton />
      <LivestreamScreenShareButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
