import React from 'react';
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
  const {
    theme: { colors, viewerLiveStreamControls },
  } = useTheme();
  return (
    <View
      style={[
        styles.bottom,
        { backgroundColor: colors.static_overlay },
        viewerLiveStreamControls.container,
      ]}
    >
      <View style={[styles.leftElement, viewerLiveStreamControls.leftElement]}>
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
  );
};

const styles = StyleSheet.create({
  bottom: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    zIndex: 1,
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
