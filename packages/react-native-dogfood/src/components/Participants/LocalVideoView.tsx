import {
  useStreamVideoStoreValue,
  VideoRenderer,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';

type LocalVideoViewProps = {
  isVisible: boolean;
};

const LocalVideoView = ({ isVisible }: LocalVideoViewProps) => {
  const localMediaStream = useStreamVideoStoreValue(
    (store) => store.localMediaStream,
  );
  const cameraBackFacingMode = useStreamVideoStoreValue(
    (store) => store.cameraBackFacingMode,
  );
  const isVideoMuted = useAppGlobalStoreValue((store) => store.isVideoMuted);
  if (!isVisible || !localMediaStream || isVideoMuted) {
    return null;
  }

  return (
    <VideoRenderer
      mirror={!cameraBackFacingMode}
      mediaStream={localMediaStream}
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
export default LocalVideoView;
