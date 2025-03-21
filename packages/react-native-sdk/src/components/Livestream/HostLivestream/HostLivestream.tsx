import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import InCallManager from 'react-native-incall-manager';

import { useTheme } from '../../../contexts';
import {
  HostLivestreamTopView as DefaultHostLivestreamTopView,
  type HostLivestreamTopViewProps,
} from '../LivestreamTopView/HostLivestreamTopView';
import {
  HostLivestreamControls as DefaultHostLivestreamControls,
  type HostLivestreamControlsProps,
} from '../LivestreamControls/HostLivestreamControls';
import {
  LivestreamLayout as DefaultLivestreamLayout,
  type LivestreamLayoutProps,
} from '../LivestreamLayout';
import { Z_INDEX } from '../../../constants';
import {
  FloatingParticipantView as DefaultFloatingParticipantView,
  type FloatingParticipantViewProps,
} from '../../Participant/FloatingParticipantView';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { hasVideo } from '@stream-io/video-client';
import {
  ScreenShareOverlay as DefaultScreenShaerOverlay,
  type ScreenShareOverlayProps,
} from '../../utility/ScreenShareOverlay';

/**
 * Props for the HostLivestream component.
 */
export type HostLivestreamProps = Omit<HostLivestreamTopViewProps, 'onLayout'> &
  Omit<HostLivestreamControlsProps, 'onLayout'> & {
    /**
     * Component to customize the top view at the host's live stream.
     */
    HostLivestreamTopView?: React.ComponentType<HostLivestreamTopViewProps> | null;
    /**
     * Component to customize the live stream video layout.
     */
    LivestreamLayout?: React.ComponentType<LivestreamLayoutProps> | null;
    /**
     * Component to customize the bottom view controls at the host's live stream.
     */
    HostLivestreamControls?: React.ComponentType<HostLivestreamControlsProps> | null;
    /**
     * Component to customize the FloatingParticipantView when screen is shared.
     */
    FloatingParticipantView?: React.ComponentType<FloatingParticipantViewProps> | null;
    /**
     * Component to customize the ScreenShareOverlay.
     */
    ScreenShareOverlay?: React.ComponentType<ScreenShareOverlayProps> | null;
  };

/**
 * The HostLivestream component displays the UI for the Host's live stream.
 */
export const HostLivestream = ({
  HostLivestreamTopView = DefaultHostLivestreamTopView,
  HostLivestreamControls = DefaultHostLivestreamControls,
  LivestreamLayout = DefaultLivestreamLayout,
  FloatingParticipantView = DefaultFloatingParticipantView,
  ScreenShareOverlay = DefaultScreenShaerOverlay,
  LiveIndicator,
  FollowerCount,
  DurationBadge,
  HostStartStreamButton,
  LivestreamMediaControls,
  onEndStreamHandler,
  onStartStreamHandler,
  hls,
  disableStopPublishedStreamsOnEndStream,
}: HostLivestreamProps) => {
  const styles = useStyles();
  const {
    theme: { colors, hostLivestream },
  } = useTheme();

  const { useParticipants, useHasOngoingScreenShare } = useCallStateHooks();
  const [currentSpeaker] = useParticipants();
  const hasOngoingScreenShare = useHasOngoingScreenShare();
  const floatingParticipant =
    hasOngoingScreenShare &&
    currentSpeaker &&
    hasVideo(currentSpeaker) &&
    currentSpeaker;

  // Automatically route audio to speaker devices as relevant for watching videos.
  useEffect(() => {
    InCallManager.start({ media: 'video' });
    return () => InCallManager.stop();
  }, []);

  const [topViewHeight, setTopViewHeight] = React.useState<number>();
  const [controlsHeight, setControlsHeight] = React.useState<number>();

  const topViewProps: HostLivestreamTopViewProps = {
    LiveIndicator,
    FollowerCount,
    DurationBadge,
    onLayout: (event) => {
      setTopViewHeight(event.nativeEvent.layout.height);
    },
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.sheetTertiary },
        hostLivestream.container,
      ]}
    >
      {HostLivestreamTopView && (
        <View
          style={styles.topViewContainer}
          onLayout={(event) => {
            setTopViewHeight(event.nativeEvent.layout.height);
          }}
        >
          <HostLivestreamTopView {...topViewProps} />
        </View>
      )}
      {FloatingParticipantView &&
        floatingParticipant &&
        topViewHeight &&
        controlsHeight && (
          <FloatingParticipantView
            participant={floatingParticipant}
            draggableContainerStyle={[
              StyleSheet.absoluteFill,
              {
                top: topViewHeight,
                bottom: controlsHeight,
              },
            ]}
          />
        )}
      {LivestreamLayout && (
        <LivestreamLayout ScreenShareOverlay={ScreenShareOverlay} />
      )}
      {HostLivestreamControls && (
        <HostLivestreamControls
          onEndStreamHandler={onEndStreamHandler}
          onStartStreamHandler={onStartStreamHandler}
          HostStartStreamButton={HostStartStreamButton}
          LivestreamMediaControls={LivestreamMediaControls}
          hls={hls}
          onLayout={(event) => {
            setControlsHeight(event.nativeEvent.layout.height);
          }}
          disableStopPublishedStreamsOnEndStream={
            disableStopPublishedStreamsOnEndStream
          }
        />
      )}
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingBottom: theme.variants.insets.bottom,
          paddingLeft: theme.variants.insets.left,
          paddingRight: theme.variants.insets.right,
          paddingTop: theme.variants.insets.top,
          backgroundColor: theme.colors.sheetPrimary,
        },
        topViewContainer: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: Z_INDEX.IN_FRONT,
        },
        controlsViewContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: Z_INDEX.IN_FRONT,
        },
      }),
    [theme],
  );
};
