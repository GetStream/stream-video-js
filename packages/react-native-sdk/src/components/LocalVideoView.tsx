import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { VideoRenderer } from './VideoRenderer';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { useStreamVideoStoreValue } from '../contexts';

type LocalVideoViewProps = {
  /**
   * Indicates whether the local video view is visible or not
   */
  isVisible: boolean;
  /**
   * An optional style object to be applied to the local video view
   * @defaultValue
   * The default is `{
   *     position: 'absolute',
   *     height: 140,
   *     width: 80,
   *     right: 16,
   *     top: 60,
   *     borderRadius: 10,
   *     zIndex: 1,
   *   }`
   */
  style?: StyleProp<ViewStyle>;
};

export const LocalVideoView: React.FC<LocalVideoViewProps> = ({
  isVisible,
  style = styles.container,
}: LocalVideoViewProps) => {
  /**
   * This component renders the local participant's video.
   */
  const localParticipant = useLocalParticipant();
  const cameraBackFacingMode = useStreamVideoStoreValue(
    (store) => store.cameraBackFacingMode,
  );

  if (!isVisible || !localParticipant) {
    return null;
  }

  const isVideoMuted = !localParticipant.videoStream || !localParticipant.video;
  if (isVideoMuted) {
    return null;
  }

  return (
    <VideoRenderer
      mirror={!cameraBackFacingMode}
      mediaStream={localParticipant.videoStream}
      style={style}
      zOrder={1}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: 140,
    width: 80,
    right: 16,
    top: 60,
    borderRadius: 10,
    zIndex: 1,
  },
});
