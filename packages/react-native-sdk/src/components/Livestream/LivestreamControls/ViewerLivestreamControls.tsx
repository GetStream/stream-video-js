import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import {
  ViewerLeaveStreamButton as DefaultViewerLeaveStreamButton,
  type ViewerLeaveStreamButtonProps,
} from './ViewerLeaveStreamButton';
import { useTheme } from '../../../contexts';
import { Z_INDEX } from '../../../constants';

/**
 * Props for the ViewerLivestreamControls component.
 */
export type ViewerLivestreamControlsProps = ViewerLeaveStreamButtonProps & {
  /**
   * Component to customize the leave stream button on the viewer's end live stream.
   */
  ViewerLeaveStreamButton?: React.ComponentType<ViewerLeaveStreamButtonProps> | null;
  onLayout?: ViewProps['onLayout'];
};

/**
 * The ViewerLivestreamControls component displays the call controls for the live stream at viewer's end.
 */
export const ViewerLivestreamControls = ({
  ViewerLeaveStreamButton = DefaultViewerLeaveStreamButton,
  onLeaveStreamHandler,
  onLayout,
}: ViewerLivestreamControlsProps) => {
  const {
    theme: { colors, viewerLivestreamControls },
  } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.sheetOverlay },
        viewerLivestreamControls.container,
      ]}
      onLayout={onLayout}
    >
      <View style={[styles.leftElement, viewerLivestreamControls.leftElement]}>
        {ViewerLeaveStreamButton && (
          <ViewerLeaveStreamButton
            onLeaveStreamHandler={onLeaveStreamHandler}
          />
        )}
      </View>
      <View
        style={[styles.rightElement, viewerLivestreamControls.rightElement]}
      />
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
    zIndex: Z_INDEX.IN_FRONT,
  },
  content: {},
  leftElement: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightElement: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
