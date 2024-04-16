import React from 'react';
import { StyleSheet, View } from 'react-native';
import { appTheme } from '../../theme';
import {
  ViewerLeaveStreamButton,
  ViewerLivestreamControlsProps,
} from '@stream-io/video-react-native-sdk';
import { LiveStreamChatControlButton } from './LiveStreamChatControlButton';

type CustomViewerLiveStreamControlsProps = {
  onChatButtonPress: () => void;
  handleLeaveCall: () => void;
} & ViewerLivestreamControlsProps;

export const ViewerLiveStreamControls = ({
  handleLeaveCall,
  onChatButtonPress,
  onLayout,
}: CustomViewerLiveStreamControlsProps) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: appTheme.colors.static_overlay,
        },
      ]}
      // @ts-expect-error the RN layout change types mismatch between SDK and here
      onLayout={onLayout}
    >
      <View style={[styles.leftElement]}>
        <ViewerLeaveStreamButton onLeaveStreamHandler={handleLeaveCall} />
      </View>
      <View style={[styles.rightElement]}>
        <LiveStreamChatControlButton onPress={onChatButtonPress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  leftElement: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightElement: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
