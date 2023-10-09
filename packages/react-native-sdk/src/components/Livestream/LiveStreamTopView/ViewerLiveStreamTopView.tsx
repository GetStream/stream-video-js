import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  ViewerDurationBadge as DefaultViewerDurationBadge,
  ViewerDurationBadgeProps,
} from './ViewerDurationBadge';
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
  DurationBadge?: React.ComponentType<ViewerDurationBadgeProps> | null;
  LiveIndicator?: React.ComponentType<LiveIndicatorProps> | null;
  FollowerCount?: React.ComponentType<FollowerCountProps> | null;
};

/**
 * The ViewerLiveStreamTopView component displays the top view component of the viewer's live stream.
 */
export const ViewerLiveStreamTopView = ({
  DurationBadge = DefaultViewerDurationBadge,
  LiveIndicator = DefaultLiveIndicator,
  FollowerCount = DefaultFollowerCount,
}: ViewerLiveStreamTopViewProps) => {
  const {
    theme: { colors },
  } = useTheme();
  return (
    <View style={[styles.top, { backgroundColor: colors.static_overlay }]}>
      <View style={styles.leftElement}>
        <View style={styles.liveInfo}>
          {LiveIndicator && <LiveIndicator />}
          {FollowerCount && <FollowerCount />}
        </View>
      </View>
      <View style={styles.centerElement}>
        {DurationBadge && <DurationBadge />}
      </View>
      <View style={styles.rightElement} />
    </View>
  );
};

const styles = StyleSheet.create({
  top: {
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
