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
    theme: { colors },
  } = useTheme();
  return (
    <View style={[styles.bottom, { backgroundColor: colors.static_overlay }]}>
      <View style={styles.leftElement}>
        {ViewerLeaveStreamButton && (
          <ViewerLeaveStreamButton
            onLeaveStreamHandler={onLeaveStreamHandler}
          />
        )}
      </View>
      <View style={styles.rightElement} />
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
  centerElement: {
    flex: 1,
    alignItems: 'center',
    flexGrow: 3,
  },
  rightElement: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
