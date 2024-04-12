import {
  LivestreamAudioControlButton,
  LivestreamVideoControlButton,
  LivestreamScreenShareToggleButton,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LiveStreamChatControlButton } from './LiveStreamChatControlButton';

/**
 * Props for the LivestreamMediaControls component.
 */
export type LivestreamMediaControlsProps = {
  onChatButtonPress: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

/**
 * The LivestreamMediaControls component controls the media publish/unpublish for the host's live stream.
 * Note: this does not include the start/end livestream button.
 */
export const HostLivestreamMediaControls = ({
  onChatButtonPress,
  onLayout,
}: LivestreamMediaControlsProps) => {
  return (
    <View style={styles.container} onLayout={onLayout}>
      <LivestreamAudioControlButton />
      <LivestreamVideoControlButton />
      <LivestreamScreenShareToggleButton />
      <LiveStreamChatControlButton onPress={onChatButtonPress} />
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
