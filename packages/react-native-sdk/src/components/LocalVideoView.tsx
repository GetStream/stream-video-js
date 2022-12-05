import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { VideoRenderer } from './VideoRenderer';
import { useLocalParticipant } from '@stream-io/video-react-bindings';
import { useStreamVideoStoreValue } from '../contexts';
import { Avatar } from './Avatar';

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
  const videoMuted = useStreamVideoStoreValue((store) => store.isVideoMuted);

  if (!isVisible || !localParticipant) {
    return null;
  }

  const isVideoMuted =
    !localParticipant.videoStream || !localParticipant.video || videoMuted;

  if (isVideoMuted) {
    return (
      <View style={{ ...(style as Object), ...styles.avatarWrapper }}>
        <Avatar participant={localParticipant} radius={50} />
      </View>
    );
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
  avatarWrapper: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
