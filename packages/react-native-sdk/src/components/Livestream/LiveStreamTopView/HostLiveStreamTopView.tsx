import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  HostDurationBadge as DefaultHostDurationBadge,
  HostDurationBadgeProps,
} from './HostDurationBadge';
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
 * Props for the HostLiveStreamTopView component.
 */
export type HostLiveStreamTopViewProps = {
  /**
   * Component to customize the Duration badge component on the host's live stream's top view.
   */
  DurationBadge?: React.ComponentType<HostDurationBadgeProps> | null;
  /**
   * Component to customize the Live indicator on the host's live stream's top view.
   */
  LiveIndicator?: React.ComponentType<LiveIndicatorProps> | null;
  /**
   * Component to customize the Follower count indicator on the host's live stream's top view.
   */
  FollowerCount?: React.ComponentType<FollowerCountProps> | null;
};

/**
 * The HostLiveStreamTopView component displays the top view component of the host's live stream.
 */
export const HostLiveStreamTopView = ({
  DurationBadge = DefaultHostDurationBadge,
  LiveIndicator = DefaultLiveIndicator,
  FollowerCount = DefaultFollowerCount,
}: HostLiveStreamTopViewProps) => {
  const {
    theme: { colors },
  } = useTheme();
  return (
    <View style={[styles.top, { backgroundColor: colors.static_overlay }]}>
      <View style={styles.leftElement}>
        {DurationBadge && <DurationBadge />}
      </View>
      <View style={styles.centerElement} />
      <View style={styles.rightElement}>
        <View style={styles.liveInfo}>
          {LiveIndicator && <LiveIndicator />}
          {FollowerCount && <FollowerCount />}
        </View>
      </View>
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
  },
  rightElement: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
