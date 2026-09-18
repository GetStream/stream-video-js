import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../contexts';
import {
  ViewerLivestreamTopView as DefaultViewerLivestreamTopView,
  type ViewerLivestreamTopViewProps,
} from '../LivestreamTopView/ViewerLivestreamTopView';
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
import { getRNInCallManagerLibNoThrow } from '../../../modules/call-manager/PrevLibDetection';
import {
  ViewerStatusPanel as DefaultViewerStatusPanel,
  type ViewerStatusPanelProps,
} from './ViewerStatusPanel';
import { Z_INDEX } from '../../../constants';
import { ViewerLivestreamOverlay } from './ViewerLivestreamOverlay';

/**
 * Props for the ViewerLivestream component.
 */
export type ViewerLivestreamProps = Omit<
  ViewerLivestreamTopViewProps,
  'showControls' | 'onLayout'
> &
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
     * Component to customize the FloatingParticipantView when screen is shared.
     */
    FloatingParticipantView?: React.ComponentType<FloatingParticipantViewProps> | null;
    /**
     * Component to customize the status panel at the viewer's live stream.
     */
    ViewerStatusPanel?: React.ComponentType<ViewerStatusPanelProps> | null;
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
  ViewerLivestreamTopView = DefaultViewerLivestreamTopView,
  ViewerStatusPanel = DefaultViewerStatusPanel,
  LivestreamLayout = DefaultLivestreamLayout,
  FloatingParticipantView = DefaultFloatingParticipantView,
  DurationBadge,
  onLeaveStreamHandler,
  joinBehavior,
}: ViewerLivestreamProps) => {
  const call = useCall();
  const {
    theme: { viewerLivestream, primitives, insets },
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
  const [showControls, setShowControls] = useState(true);

  const canJoinEarly = useCanJoinEarly();
  const canJoinBackstage =
    useOwnCapabilities()?.includes('join-backstage') ?? false;

  const [topViewHeight, setTopViewHeight] = React.useState<number>();

  // Automatically route audio to speaker devices as relevant for watching videos.
  useEffect(() => {
    const prevInCallManager = getRNInCallManagerLibNoThrow();
    if (!prevInCallManager) return;
    prevInCallManager.start({ media: 'video' });
    return () => {
      prevInCallManager.stop();
    };
  }, []);

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      setHasLeft(true);
    }
  }, [callingState]);

  useEffect(() => {
    const canJoinAsap = canJoinLive || canJoinEarly || canJoinBackstage;
    const join = joinBehavior ?? 'asap';
    const canJoin =
      (join === 'asap' && canJoinAsap) || (join === 'live' && canJoinLive);

    if (call && callingState === CallingState.IDLE && canJoin && !hasLeft) {
      call.join().catch((error) => {
        console.error('Failed to join call', error);
      });
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
    return (
      <View style={[styles.container, viewerLivestream.container]}>
        <CallEndedView />
      </View>
    );
  }

  if (!canJoinLive || callingState !== CallingState.JOINED) {
    return (
      <View style={[styles.container, viewerLivestream.container]}>
        <ViewerLobby isLive={canJoinLive} />
      </View>
    );
  }

  const statusPanelStyle = {
    bottom: insets.bottom + primitives.spacingXxs,
  };

  return (
    <View style={[styles.container, viewerLivestream.container]}>
      <View
        style={[styles.livestreamLayout, viewerLivestream.livestreamLayout]}
      >
        {LivestreamLayout && <LivestreamLayout style={{ borderRadius: 0 }} />}
      </View>
      {ViewerLivestreamTopView && (
        <ViewerLivestreamTopView
          DurationBadge={DurationBadge}
          showControls={showControls}
          onLayout={(event) => {
            setTopViewHeight(event.nativeEvent.layout.height);
          }}
          onLeaveStreamHandler={onLeaveStreamHandler}
          style={styles.topView}
        />
      )}
      {FloatingParticipantView && floatingParticipant && topViewHeight && (
        <FloatingParticipantView
          participant={floatingParticipant}
          draggableContainerStyle={[
            StyleSheet.absoluteFill,
            {
              top: topViewHeight,
              bottom: 0,
            },
          ]}
        />
      )}
      <ViewerLivestreamOverlay
        showControls={showControls}
        setShowControls={(value) => setShowControls(value)}
      />
      {ViewerStatusPanel && (
        <ViewerStatusPanel
          showControls={showControls}
          setShowControls={(value) => setShowControls(value)}
          style={[
            styles.viewerStatusPanel,
            viewerLivestream.viewerStatusPanel,
            statusPanelStyle,
          ]}
        />
      )}
    </View>
  );
};

const useCanJoinEarly = () => {
  const { useCallStartsAt, useCallSettings } = useCallStateHooks();
  const startsAt = useCallStartsAt();
  const settings = useCallSettings();
  const joinAheadTimeSeconds =
    settings?.backstage?.join_ahead_time_seconds ?? 0;
  const [canJoinEarly, setCanJoinEarly] = useState(() =>
    checkCanJoinEarly(startsAt, joinAheadTimeSeconds),
  );

  useEffect(() => {
    if (canJoinEarly) return;
    const handle = setInterval(() => {
      setCanJoinEarly(checkCanJoinEarly(startsAt, joinAheadTimeSeconds));
    }, 1000);

    return () => clearInterval(handle);
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  livestreamLayout: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  viewerStatusPanel: {
    position: 'absolute',
    zIndex: Z_INDEX.IN_FRONT + 2,
  },
  topView: {
    zIndex: Z_INDEX.IN_FRONT,
  },
});
