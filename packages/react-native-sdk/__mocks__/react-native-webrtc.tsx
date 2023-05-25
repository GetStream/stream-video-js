import React from 'react';
import { View, ViewProps } from 'react-native';

export const MediaStream = undefined;

interface MockProps extends ViewProps {
  mirror?: boolean;
  objectFit?: 'contain' | 'cover';
  streamURL: string;
  zOrder?: number;
}
// Override and mock RTCView with a regular View to mimic the behavior of the
// react-native-webrtc video component.
export const RTCView = (props: MockProps) => (
  // @ts-ignore
  <View accessibilityLabel={'participant-media-stream'} {...props} />
);
