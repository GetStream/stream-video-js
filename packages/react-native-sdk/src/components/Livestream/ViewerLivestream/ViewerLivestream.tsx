import React from 'react';

import { StyleSheet, SafeAreaView, View } from 'react-native';
import { useIncallManager } from '../../../hooks';
import { useTheme } from '../../../contexts';
import {
  ViewerLivestreamTopView as DefaultViewerLivestreamTopView,
  ViewerLivestreamTopViewProps,
} from '../LivestreamTopView/ViewerLivestreamTopView';
import {
  ViewerLivestreamControls as DefaultViewerLivestreamControls,
  ViewerLivestreamControlsProps,
} from '../LivestreamControls/ViewerLivestreamControls';
import { ViewerLeaveStreamButtonProps } from '../LivestreamControls/ViewerLeaveStreamButton';
import {
  LivestreamLayout as DefaultLivestreamLayout,
  LivestreamLayoutProps,
} from '../LivestreamLayout';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  FloatingParticipantView as DefaultFloatingParticipantView,
  FloatingParticipantViewProps,
} from '../../Participant';
import { Z_INDEX } from '../../../constants';

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
  const {
    theme: { colors, viewerLivestream },
  } = useTheme();
  const { useHasOngoingScreenShare, useParticipants } = useCallStateHooks();
  const hasOngoingScreenShare = useHasOngoingScreenShare();
  const [currentSpeaker] = useParticipants();

  // Automatically route audio to speaker devices as relevant for watching videos.
  useIncallManager({ media: 'video', auto: true });

  const topViewProps: ViewerLivestreamTopViewProps = {
    LiveIndicator,
    FollowerCount,
    DurationBadge,
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.static_grey },
        viewerLivestream.container,
      ]}
    >
      <View style={[styles.view, viewerLivestream.view]}>
        {ViewerLivestreamTopView && (
          <ViewerLivestreamTopView {...topViewProps} />
        )}
        <View
          style={[
            styles.floatingParticipantView,
            viewerLivestream.floatingParticipantView,
          ]}
        >
          {hasOngoingScreenShare && FloatingParticipantView && (
            <FloatingParticipantView participant={currentSpeaker} />
          )}
        </View>

        {ViewerLivestreamControls && (
          <ViewerLivestreamControls
            ViewerLeaveStreamButton={ViewerLeaveStreamButton}
            onLeaveStreamHandler={onLeaveStreamHandler}
          />
        )}
      </View>
      {LivestreamLayout && <LivestreamLayout />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingParticipantView: {
    flex: 1,
  },
  view: {
    ...StyleSheet.absoluteFillObject,
    zIndex: Z_INDEX.IN_FRONT,
  },
});
