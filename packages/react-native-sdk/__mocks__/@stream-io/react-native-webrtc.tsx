import React from 'react';
import { View, ViewProps } from 'react-native';
import { ComponentTestIds } from '../../src/constants/TestIds';

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
  <View testID={ComponentTestIds.PARTICIPANT_MEDIA_STREAM} {...props} />
);
