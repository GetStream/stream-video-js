import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import { useTheme } from '../../../contexts';
import { type ViewerLivestreamTopViewProps } from '../LivestreamTopView/ViewerLivestreamTopView';
import {
  ViewerLivestreamControls as DefaultViewerLivestreamControls,
  type ViewerLivestreamControlsProps,
} from '../LivestreamControls/ViewerLivestreamControls';
import type { ViewerLeaveStreamButtonProps } from '../LivestreamControls/ViewerLeaveStreamButton';
import {
  LivestreamLayout as DefaultLivestreamLayout,
  type LivestreamLayoutProps,
} from '../LivestreamLayout';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  FloatingParticipantView as DefaultFloatingParticipantView,
  type FloatingParticipantViewProps,
} from '../../Participant';
import { CallingState, hasVideo } from '@stream-io/video-client';
import { CallEndedView } from '../LivestreamPlayer/LivestreamEnded';
import { ViewerLobby } from './ViewerLobby';

/**
 * Props for the ViewerLivestream component.
 */
export type ViewerLivestreamProps = ViewerLivestreamTopViewProps &
  ViewerLivestreamControlsProps &
  ViewerLeaveStreamButtonProps & {
    /**
     * Component to customize the top view at the viewer's live stream.
     */
    ViewerLivestreamTopView?: React.ComponentType<ViewerLivestreamTopViewProps> | null;
    /**
     * Component to customize the live stream video layout.
     */
    LivestreamLayout?: React.ComponentType<LivestreamLayoutProps> | null;
    /**
     * Component to customize the bottom view controls at the viewer's live stream.
     */
    ViewerLivestreamControls?: React.ComponentType<ViewerLivestreamControlsProps> | null;
    /**
     * Component to customize the FloatingParticipantView when screen is shared.
     */
    FloatingParticipantView?: React.ComponentType<FloatingParticipantViewProps> | null;
    /**
     * Determines when the viewer joins the call.
     *
     * `"asap"` behavior means joining the call as soon as it is possible
     * (either the `join_ahead_time_seconds` setting allows it, or the user
     * has a the capability to join backstage).
     */
    joinBehavior?: 'asap' | 'live';
  };

/**
 * The ViewerLivestream component renders the UI for the Viewer's live stream.
 */
export const ViewerLivestream = ({
  ViewerLivestreamTopView,
  ViewerLivestreamControls = DefaultViewerLivestreamControls,
  LivestreamLayout = DefaultLivestreamLayout,
  FloatingParticipantView = DefaultFloatingParticipantView,
  LiveIndicator,
  FollowerCount,
  DurationBadge,
  ViewerLeaveStreamButton,
  onLeaveStreamHandler,
  joinBehavior,
}: ViewerLivestreamProps) => {
  const styles = useStyles();
  const call = useCall();
  const {
    theme: { viewerLivestream },
  } = useTheme();
  const {
    useHasOngoingScreenShare,
    useParticipants,
    useCallCallingState,
    useCallEndedAt,
    useIsCallLive,
    useOwnCapabilities,
  } = useCallStateHooks();
  const canJoinLive = useIsCallLive();
  const callingState = useCallCallingState();
  const endedAt = useCallEndedAt();
  const hasOngoingScreenShare = useHasOngoingScreenShare();
  const [currentSpeaker] = useParticipants();
  const floatingParticipant =
    hasOngoingScreenShare &&
    currentSpeaker &&
    hasVideo(currentSpeaker) &&
    currentSpeaker;
  const [hasLeft, setHasLeft] = useState(false);

  const canJoinEarly = useCanJoinEarly();
  const canJoinBackstage =
    useOwnCapabilities()?.includes('join-backstage') ?? false;

  const [topViewHeight, setTopViewHeight] = React.useState<number>();
  const [controlsHeight, setControlsHeight] = React.useState<number>();

  // Automatically route audio to speaker devices as relevant for watching videos.
  useEffect(() => {
    InCallManager.start({ media: 'video' });
    return () => InCallManager.stop();
  }, []);

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      setHasLeft(true);
    }
  }, [callingState]);

  const topViewProps: ViewerLivestreamTopViewProps = {
    LiveIndicator,
    FollowerCount,
    DurationBadge,
    onLayout: (event) => {
      setTopViewHeight(event.nativeEvent.layout.height);
    },
  };

  useEffect(() => {
    const handleJoinCall = async () => {
      try {
        await call?.join();
      } catch (error) {
        console.error('Failed to join call', error);
      }
    };

    const canJoinAsap = canJoinLive || canJoinEarly || canJoinBackstage;
    const join = joinBehavior ?? 'asap';
    const canJoin =
      (join === 'asap' && canJoinAsap) || (join === 'live' && canJoinLive);

    if (call && callingState === CallingState.IDLE && canJoin && !hasLeft) {
      handleJoinCall();
    }
  }, [
    canJoinLive,
    call,
    canJoinBackstage,
    canJoinEarly,
    joinBehavior,
    callingState,
    hasLeft,
  ]);

  if (endedAt != null) {
    return <CallEndedView />;
  }

  if (!canJoinLive || callingState !== CallingState.JOINED) {
    return <ViewerLobby isLive={canJoinLive} />;
  }

  return (
    <View style={[styles.container, viewerLivestream.container]}>
      {ViewerLivestreamTopView && <ViewerLivestreamTopView {...topViewProps} />}
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
      {LivestreamLayout && <LivestreamLayout />}
      {ViewerLivestreamControls && (
        <ViewerLivestreamControls
          ViewerLeaveStreamButton={ViewerLeaveStreamButton}
          onLeaveStreamHandler={onLeaveStreamHandler}
          onLayout={(event) => {
            setControlsHeight(event.nativeEvent.layout.height);
          }}
        />
      )}
    </View>
  );
};

const useCanJoinEarly = () => {
  const { useCallStartsAt, useCallSettings } = useCallStateHooks();
  const startsAt = useCallStartsAt();
  const settings = useCallSettings();
  const joinAheadTimeSeconds = settings?.backstage.join_ahead_time_seconds;
  const [canJoinEarly, setCanJoinEarly] = useState(() =>
    checkCanJoinEarly(startsAt, joinAheadTimeSeconds),
  );

  useEffect(() => {
    if (!canJoinEarly) {
      const handle = setInterval(() => {
        setCanJoinEarly(checkCanJoinEarly(startsAt, joinAheadTimeSeconds));
      }, 1000);

      return () => clearInterval(handle);
    }
  }, [canJoinEarly, startsAt, joinAheadTimeSeconds]);

  return canJoinEarly;
};

const checkCanJoinEarly = (
  startsAt: Date | undefined,
  joinAheadTimeSeconds: number | undefined,
) => {
  if (!startsAt) {
    return false;
  }

  return Date.now() >= +startsAt - (joinAheadTimeSeconds ?? 0) * 1000;
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
      }),
    [theme],
  );
};
