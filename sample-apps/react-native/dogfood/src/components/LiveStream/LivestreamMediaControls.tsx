import {
  LivestreamAudioControlButton,
  LivestreamVideoControlButton,
  LivestreamScreenShareButton,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LiveStreamChatControlButton } from './LivestreamChatComponent';

/**
 * Props for the LivestreamMediaControls component.
 */
export type LivestreamMediaControlsProps = {
  handlePresentModalPress: () => void;
};

/**
 * The LivestreamMediaControls component controls the media publish/unpublish for the host's live stream.
 */
export const LivestreamMediaControls = ({
  handlePresentModalPress,
}: LivestreamMediaControlsProps) => {
  return (
    <View style={styles.container}>
      <LivestreamAudioControlButton />
      <LivestreamVideoControlButton />
      <LivestreamScreenShareButton />
      <LiveStreamChatControlButton
        handlePresentModalPress={handlePresentModalPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
    height: 40,
    width: 40,
  },
  icon: {
    height: 20,
    width: 20,
  },
});
