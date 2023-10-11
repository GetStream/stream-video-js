import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ViewerLeaveStreamButton as DefaultViewerLeaveStreamButton,
  ViewerLeaveStreamButtonProps,
} from './ViewerLeaveStreamButton';
import { useTheme } from '../../../contexts';

/**
 * Props for the ViewerLiveStreamControls component.
 */
export type ViewerLiveStreamControlsProps = ViewerLeaveStreamButtonProps & {
  /**
   * Component to customize the leave stream button on the viewer's end live stream.
   */
  ViewerLeaveStreamButton?: React.ComponentType<ViewerLeaveStreamButtonProps> | null;
};

/**
 * The ViewerLiveStreamControls component displays the call controls for the live stream at viewer's end.
 */
export const ViewerLiveStreamControls = ({
  ViewerLeaveStreamButton = DefaultViewerLeaveStreamButton,
  onLeaveStreamHandler,
}: ViewerLiveStreamControlsProps) => {
  const [liveStreamBottomViewHeight, setliveStreamBottomViewHeight] =
    useState<number>(0);
  const {
    theme: { colors, viewerLiveStreamControls },
  } = useTheme();

  const onLayout: React.ComponentProps<typeof View>['onLayout'] = (event) => {
    const { height } = event.nativeEvent.layout;
    if (setliveStreamBottomViewHeight) {
      setliveStreamBottomViewHeight(height);
    }
  };

  return (
    <View style={[styles.container, viewerLiveStreamControls.container]}>
      <View
        style={[
          {
            height: liveStreamBottomViewHeight,
            backgroundColor: colors.static_overlay,
          },
          viewerLiveStreamControls.background,
        ]}
      />
      <View
        style={[styles.content, viewerLiveStreamControls.content]}
        onLayout={onLayout}
      >
        <View
          style={[styles.leftElement, viewerLiveStreamControls.leftElement]}
        >
          {ViewerLeaveStreamButton && (
            <ViewerLeaveStreamButton
              onLeaveStreamHandler={onLeaveStreamHandler}
            />
          )}
        </View>
        <View
          style={[styles.rightElement, viewerLiveStreamControls.rightElement]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  content: {
    position: 'absolute',
    top: 0,
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
