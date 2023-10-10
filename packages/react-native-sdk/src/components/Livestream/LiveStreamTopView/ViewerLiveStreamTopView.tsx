import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  DurationBadge as DefaultDurationBadge,
  DurationBadgeProps,
} from './DurationBadge';
import {
  LiveIndicator as DefaultLiveIndicator,
  LiveIndicatorProps,
} from './LiveIndicator';
import {
  FollowerCount as DefaultFollowerCount,
  FollowerCountProps,
} from './FollowerCount';
import { useTheme } from '../../../contexts';

/**
 * Props for the ViewerLiveStreamTopView component.
 */
export type ViewerLiveStreamTopViewProps = {
  /**
   * Component to customize the Duration badge component on the viewer's live stream's top view.
   */
  DurationBadge?: React.ComponentType<DurationBadgeProps> | null;
  /**
   * Component to customize the Live indicator on the viewer's live stream's top view.
   */
  LiveIndicator?: React.ComponentType<LiveIndicatorProps> | null;
  /**
   * Component to customize the Follower count indicator on the viewer's live stream's top view.
   */
  FollowerCount?: React.ComponentType<FollowerCountProps> | null;
};

/**
 * The ViewerLiveStreamTopView component displays the top view component of the viewer's live stream.
 */
export const ViewerLiveStreamTopView = ({
  DurationBadge = DefaultDurationBadge,
  LiveIndicator = DefaultLiveIndicator,
  FollowerCount = DefaultFollowerCount,
}: ViewerLiveStreamTopViewProps) => {
  const {
    theme: { colors, viewerLiveStreamTopView },
  } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.static_overlay },
        viewerLiveStreamTopView.container,
      ]}
    >
      <View style={[styles.leftElement, viewerLiveStreamTopView.leftElement]}>
        <View style={[styles.liveInfo, viewerLiveStreamTopView.liveInfo]}>
          {LiveIndicator && <LiveIndicator />}
          {FollowerCount && <FollowerCount />}
        </View>
      </View>
      <View
        style={[styles.centerElement, viewerLiveStreamTopView.centerElement]}
      >
        {DurationBadge && <DurationBadge mode="viewer" />}
      </View>
      <View
        style={[styles.rightElement, viewerLiveStreamTopView.rightElement]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    zIndex: 1,
    borderBottomEndRadius: 8,
    borderBottomStartRadius: 8,
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
