import React from 'react';
import { StyleSheet, View } from 'react-native';
import { appTheme } from '../../theme';
import { ViewerLeaveStreamButton } from '@stream-io/video-react-native-sdk';
import { LiveStreamChatControlButton } from './LivestreamChatComponent';

type ViewerLiveStreamControlsProps = {
  handlePresentModalPress: () => void;
  handleLeaveCall: () => void;
};

export const ViewerLiveStreamControls = ({
  handleLeaveCall,
  handlePresentModalPress,
}: ViewerLiveStreamControlsProps) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: appTheme.colors.static_overlay,
        },
      ]}
    >
      <View style={[styles.leftElement]}>
        <ViewerLeaveStreamButton onLeaveStreamHandler={handleLeaveCall} />
      </View>
      <View style={[styles.rightElement]}>
        <LiveStreamChatControlButton
          handlePresentModalPress={handlePresentModalPress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
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
