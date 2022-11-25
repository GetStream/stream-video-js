import React from 'react';
import { StyleSheet } from 'react-native';
import { VideoRenderer } from './VideoRenderer';
import { useLocalParticipant } from '@stream-io/video-react-bindings';

type LocalVideoViewProps = {
  isVisible: boolean;
};

export const LocalVideoView = ({ isVisible }: LocalVideoViewProps) => {
  const localParticipant = useLocalParticipant();

  if (!isVisible || !localParticipant) {
    return null;
  }

  // const cameraBackFacingMode = useAppGlobalStoreValue(
  //   (store) => store.cameraBackFacingMode,
  // );
  const cameraBackFacingMode = false;
  const isVideoMuted = !localParticipant.videoStream || !localParticipant.video;
  if (isVideoMuted) {
    return null;
  }

  return (
    <VideoRenderer
      mirror={!cameraBackFacingMode}
      mediaStream={localParticipant.videoStream}
      style={styles.container}
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
