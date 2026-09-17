import React, { useState } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import {
  DurationBadge as DefaultDurationBadge,
  type DurationBadgeProps,
} from './DurationBadge';
import { type LiveIndicatorProps } from './LiveIndicator';
import { type FollowerCountProps } from './FollowerCount';
import { useTheme } from '../../../contexts';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { Z_INDEX } from '../../../constants';
import { HangUpCallButton } from '../../Call';
import { SfuModels, videoLoggerSystem } from '@stream-io/video-client';

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
  /**
   * Enable HTTP live streaming
   */
  hls?: boolean;
  /**
   * Disable the published streams to not be stopped if the host ends the livestream.
   */
  disableStopPublishedStreamsOnEndStream?: boolean;
  /**
   * Handler to be called after the End Stream button is pressed.
   * @returns void
   */
  onEndStreamHandler?: () => void;
  onLayout?: ViewProps['onLayout'];
};

/**
 * The HostLivestreamTopView component displays the top view component of the host's live stream.
 */
export const HostLivestreamTopView = ({
  DurationBadge = DefaultDurationBadge,
  onLayout,
  onEndStreamHandler,
  hls,
  disableStopPublishedStreamsOnEndStream,
}: HostLivestreamTopViewProps) => {
  const call = useCall();
  const { useIsCallLive, useIsCallHLSBroadcastingInProgress } =
    useCallStateHooks();
  const isCallLive = useIsCallLive();
  const isBroadcasting = useIsCallHLSBroadcastingInProgress();
  const liveOrBroadcasting = isCallLive || isBroadcasting;
  const {
    theme: { hostLivestreamTopView },
  } = useTheme();
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);

  const onEndStreamButtonPress = async () => {
    if (!liveOrBroadcasting || isAwaitingResponse) {
      return;
    }

    try {
      setIsAwaitingResponse(true);
      if (!disableStopPublishedStreamsOnEndStream) {
        await call?.stopPublish(SfuModels.TrackType.VIDEO);
        await call?.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
      }
      if (hls) {
        await call?.stopHLS();
      } else {
        await call?.stopLive();
      }

      setIsAwaitingResponse(false);
      if (onEndStreamHandler) {
        onEndStreamHandler();
      }
    } catch (error) {
      const logger = videoLoggerSystem.getLogger('HostLivestreamTopView');
      logger.error('Error stopping livestream', error);
    }
  };

  return (
    <View
      style={[styles.container, hostLivestreamTopView.container]}
      onLayout={onLayout}
    >
      <View
        style={[styles.leftElement, hostLivestreamTopView.leftElement]}
      ></View>
      <View style={[styles.centerElement, hostLivestreamTopView.centerElement]}>
        {DurationBadge && <DurationBadge mode="host" />}
      </View>
      <View style={[styles.rightElement, hostLivestreamTopView.rightElement]}>
        <HangUpCallButton
          disabled={!liveOrBroadcasting || isAwaitingResponse}
          onPressHandler={onEndStreamButtonPress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
