import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { MediaStream, RTCView } from 'react-native-webrtc';

type VideoRendererProps = {
  mediaStream: MediaStream;
  mirror?: boolean;
  style?: StyleProp<ViewStyle>;
  zOrder?: number;
  objectFit?: 'contain' | 'cover';
};

export const VideoRenderer = ({
  mediaStream,
  mirror = false,
  style = { flex: 1 },
  zOrder = undefined,
  objectFit = 'cover',
}: VideoRendererProps) => {
  return (
    <RTCView
      //@ts-ignore
      streamURL={mediaStream.toURL()}
      mirror={mirror}
      style={style}
      objectFit={objectFit}
      zOrder={zOrder}
    />
  );
};
