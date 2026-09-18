import React from 'react';
import {
  StyleProp,
  StyleSheet,
  ViewStyle,
  View,
  type ViewProps,
} from 'react-native';
import {
  DurationBadge as DefaultDurationBadge,
  type DurationBadgeProps,
} from './DurationBadge';
import { useTheme } from '../../../contexts';
import { ViewerLeaveStreamButton } from '../LivestreamControls';

/**
 * Props for the ViewerLivestreamTopView component.
 */
export type ViewerLivestreamTopViewProps = {
  /**
   * Component to customize the Duration badge component on the viewer's live stream's top view.
   */
  DurationBadge?: React.ComponentType<DurationBadgeProps> | null;
  /**
   * Whether the controls are currently visible.
   */
  showControls: boolean;
  /**
   * Handler to be called when the leave stream button is pressed.
   */
  onLeaveStreamHandler?: () => void;
  /**
   * Handler to be called when the layout of the component changes.
   */
  onLayout?: ViewProps['onLayout'];
  /**
   * Style to be applied to the component.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * The ViewerLivestreamTopView component displays the top view component of the viewer's live stream.
 */
export const ViewerLivestreamTopView = ({
  DurationBadge = DefaultDurationBadge,
  showControls,
  onLeaveStreamHandler,
  onLayout,
  style,
}: ViewerLivestreamTopViewProps) => {
  const {
    theme: { viewerLivestreamTopView, insets },
  } = useTheme();

  return (
    <View
      style={[
        styles.container,
        viewerLivestreamTopView.container,
        { opacity: showControls ? 1 : 0, paddingTop: insets.top },
        style,
      ]}
      pointerEvents={showControls ? 'auto' : 'none'}
      onLayout={onLayout}
    >
      <View
        style={[styles.leftElement, viewerLivestreamTopView.leftElement]}
      ></View>
      <View
        style={[styles.centerElement, viewerLivestreamTopView.centerElement]}
      >
        {DurationBadge && <DurationBadge mode="viewer" />}
      </View>
      <View style={[styles.rightElement, viewerLivestreamTopView.rightElement]}>
        <ViewerLeaveStreamButton onLeaveStreamHandler={onLeaveStreamHandler} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveInfo: {
    flexDirection: 'row',
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
