import React from 'react';
import { View } from 'react-native';

export default {
  MediaStream: undefined,
  // TODO: SG: 2021-09-30: render a RN view instead of null
  RTCView: (props: any) => (
    <View accessibilityLabel={'participant-video'} {...props} />
  ),
};
