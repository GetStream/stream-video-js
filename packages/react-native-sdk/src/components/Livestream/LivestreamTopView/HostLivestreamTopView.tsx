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
import { Z_INDEX } from '../../../constants';

/**
 * Props for the HostLivestreamTopView component.
 */
export type HostLivestreamTopViewProps = {
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
 * The HostLivestreamTopView component displays the top view component of the host's live stream.
 */
export const HostLivestreamTopView = ({
  DurationBadge = DefaultDurationBadge,
  LiveIndicator = DefaultLiveIndicator,
  FollowerCount = DefaultFollowerCount,
}: HostLivestreamTopViewProps) => {
  const { useIsCallLive, useIsCallBroadcastingInProgress } =
    useCallStateHooks();
  const isCallLive = useIsCallLive();
  const isBroadcasting = useIsCallBroadcastingInProgress();

  const liveOrBroadcasting = isCallLive || isBroadcasting;
  const {
    theme: { colors, hostLivestreamTopView },
  } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.static_overlay },
        hostLivestreamTopView.container,
      ]}
    >
      <View style={[styles.leftElement, hostLivestreamTopView.leftElement]}>
        {DurationBadge && <DurationBadge mode="host" />}
      </View>
      <View
        style={[styles.centerElement, hostLivestreamTopView.centerElement]}
      />
      <View style={[styles.rightElement, hostLivestreamTopView.rightElement]}>
        <View style={[styles.liveInfo, hostLivestreamTopView.liveInfo]}>
          {liveOrBroadcasting && LiveIndicator && <LiveIndicator />}
          {FollowerCount && <FollowerCount />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomEndRadius: 8,
    borderBottomStartRadius: 8,
    zIndex: Z_INDEX.IN_FRONT,
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
