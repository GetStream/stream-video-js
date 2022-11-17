import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MediaStream, RTCView } from 'react-native-webrtc';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';

type LocalVideoViewProps = {
  isVisible: boolean;
};

type VideoRendererProps = {
  mediaStream: MediaStream;
  mirror?: boolean;
  style?: StyleProp<ViewStyle>;
  zOrder?: number;
};

export const VideoRenderer = ({
  mediaStream,
  mirror = false,
  style = { flex: 1 },
  zOrder = undefined,
}: VideoRendererProps) => {
  return (
    <RTCView
      //@ts-ignore
      streamURL={mediaStream.toURL()}
      mirror={mirror}
      style={style}
      objectFit="cover"
      zOrder={zOrder}
    />
  );
};

const LocalVideoView = ({ isVisible }: LocalVideoViewProps) => {
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const isVideoMuted = useAppGlobalStoreValue((store) => store.isVideoMuted);
  const cameraBackFacingMode = useAppGlobalStoreValue(
    (store) => store.cameraBackFacingMode,
  );
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
