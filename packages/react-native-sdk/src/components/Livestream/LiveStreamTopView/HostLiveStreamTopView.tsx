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
import { useCallStateHooks } from '@stream-io/video-react-bindings';

/**
 * Props for the HostLiveStreamTopView component.
 */
export type HostLiveStreamTopViewProps = {
  /**
   * Component to customize the Duration badge component on the host's live stream's top view.
   */
  DurationBadge?: React.ComponentType<DurationBadgeProps> | null;
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
  DurationBadge = DefaultDurationBadge,
  LiveIndicator = DefaultLiveIndicator,
  FollowerCount = DefaultFollowerCount,
}: HostLiveStreamTopViewProps) => {
  const { useIsCallLive, useIsCallBroadcastingInProgress } =
    useCallStateHooks();
  const isCallLive = useIsCallLive();
  const isBroadcasting = useIsCallBroadcastingInProgress();

  const liveOrBroadcasting = isCallLive || isBroadcasting;
  const {
    theme: { colors, hostLiveStreamTopView },
  } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.static_overlay },
        hostLiveStreamTopView.container,
      ]}
    >
      <View style={[styles.leftElement, hostLiveStreamTopView.leftElement]}>
        {DurationBadge && <DurationBadge mode="host" />}
      </View>
      <View
        style={[styles.centerElement, hostLiveStreamTopView.centerElement]}
      />
      <View style={[styles.rightElement, hostLiveStreamTopView.rightElement]}>
        <View style={[styles.liveInfo, hostLiveStreamTopView.liveInfo]}>
          {liveOrBroadcasting && LiveIndicator && <LiveIndicator />}
          {FollowerCount && <FollowerCount />}
        </View>
      </View>
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
  },
  rightElement: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
