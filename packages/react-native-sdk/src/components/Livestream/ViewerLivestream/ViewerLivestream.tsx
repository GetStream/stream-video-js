import React, { useEffect, useMemo, useState } from 'react';

import { StyleSheet, View } from 'react-native';
import InCallManager from 'react-native-incall-manager';
import { useTheme } from '../../../contexts';
import {
  ViewerLivestreamTopView as DefaultViewerLivestreamTopView,
  type ViewerLivestreamTopViewProps,
} from '../LivestreamTopView/ViewerLivestreamTopView';
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
  };

/**
 * The ViewerLivestream component renders the UI for the Viewer's live stream.
 */
export const ViewerLivestream = ({
  ViewerLivestreamTopView = DefaultViewerLivestreamTopView,
  ViewerLivestreamControls = DefaultViewerLivestreamControls,
  LivestreamLayout = DefaultLivestreamLayout,
  FloatingParticipantView = DefaultFloatingParticipantView,
  LiveIndicator,
  FollowerCount,
  DurationBadge,
  ViewerLeaveStreamButton,
  onLeaveStreamHandler,
}: ViewerLivestreamProps) => {
  const styles = useStyles();
  const call = useCall();
  const {
    theme: { viewerLivestream },
  } = useTheme();
  const { useHasOngoingScreenShare, useParticipants } = useCallStateHooks();
  const hasOngoingScreenShare = useHasOngoingScreenShare();
  const [currentSpeaker] = useParticipants();
  const floatingParticipant =
    hasOngoingScreenShare &&
    currentSpeaker &&
    hasVideo(currentSpeaker) &&
    currentSpeaker;

  const [topViewHeight, setTopViewHeight] = React.useState<number>();
  const [controlsHeight, setControlsHeight] = React.useState<number>();
  const [callJoined, setCallJoined] = useState<boolean>(false);

  // Automatically route audio to speaker devices as relevant for watching videos.
  useEffect(() => {
    InCallManager.start({ media: 'video' });
    return () => InCallManager.stop();
  }, []);

  const { useIsCallLive } = useCallStateHooks();
  const isCallLive = useIsCallLive();

  /**
   * The call is joined using the anonymous user/client.
   */
  const handleJoinCall = async () => {
    try {
      if (!(call && isCallLive)) {
        return;
      }
      if (
        [CallingState.JOINED, CallingState.JOINING].includes(
          call.state.callingState,
        )
      ) {
        setCallJoined(true);
        return;
      }
      await call?.join();
      setCallJoined(true);
    } catch (error) {
      console.error('Failed to join call', error);
    }
  };

  const callingState = call?.state.callingState;

  if (
    !isCallLive ||
    (callingState !== CallingState.LEFT && callingState !== CallingState.JOINED)
  ) {
    return (
      <ViewerLobby
        isLive={isCallLive}
        setCallJoined={setCallJoined}
        handleJoinCall={handleJoinCall}
      />
    );
  }

  if (callingState === CallingState.LEFT) {
    return <CallEndedView />;
  }

  return (
    <View style={[styles.container, viewerLivestream.container]}>
      {/* {ViewerLivestreamTopView && <ViewerLivestreamTopView {...topViewProps} />} */}
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
