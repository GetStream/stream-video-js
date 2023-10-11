import React from 'react';

import { StyleSheet, SafeAreaView, View } from 'react-native';
import { useIncallManager } from '../../../hooks';
import { useTheme } from '../../../contexts';
import {
  ViewerLiveStreamTopView as DefaultViewerLiveStreamTopView,
  ViewerLiveStreamTopViewProps,
} from '../LiveStreamTopView/ViewerLiveStreamTopView';
import {
  ViewerLiveStreamControls as DefaultViewerLiveStreamControls,
  ViewerLiveStreamControlsProps,
} from '../LiveStreamControls/ViewerLiveStreamControls';
import { ViewerLeaveStreamButtonProps } from '../LiveStreamControls/ViewerLeaveStreamButton';
import {
  LiveStreamLayout as DefaultLiveStreamLayout,
  LiveStreamLayoutProps,
} from '../LiveStreamLayout';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  FloatingParticipantView as DefaultFloatingParticipantView,
  FloatingParticipantViewProps,
} from '../../Participant';
import { Z_INDEX } from '../../../constants';

/**
 * Props for the ViewerLiveStream component.
 */
export type ViewerLiveStreamProps = ViewerLiveStreamTopViewProps &
  ViewerLiveStreamControlsProps &
  ViewerLeaveStreamButtonProps & {
    /**
     * Component to customize the top view at the viewer's live stream.
     */
    ViewerLiveStreamTopView?: React.ComponentType<ViewerLiveStreamTopViewProps> | null;
    /**
     * Component to customize the live stream video layout.
     */
    LiveStreamLayout?: React.ComponentType<LiveStreamLayoutProps> | null;
    /**
     * Component to customize the bottom view controls at the viewer's live stream.
     */
    ViewerLiveStreamControls?: React.ComponentType<ViewerLiveStreamControlsProps> | null;
    /**
     * Component to customize the FloatingParticipantView when screen is shared.
     */
    FloatingParticipantView?: React.ComponentType<FloatingParticipantViewProps> | null;
  };

/**
 * The ViewerLiveStream component renders the UI for the Viewer's live stream.
 */
export const ViewerLiveStream = ({
  ViewerLiveStreamTopView = DefaultViewerLiveStreamTopView,
  ViewerLiveStreamControls = DefaultViewerLiveStreamControls,
  LiveStreamLayout = DefaultLiveStreamLayout,
  FloatingParticipantView = DefaultFloatingParticipantView,
  LiveIndicator,
  FollowerCount,
  DurationBadge,
  ViewerLeaveStreamButton,
  onLeaveStreamHandler,
}: ViewerLiveStreamProps) => {
  const {
    theme: { colors, viewerLiveStream },
  } = useTheme();
  const { useHasOngoingScreenShare, useParticipants } = useCallStateHooks();
  const hasOngoingScreenShare = useHasOngoingScreenShare();
  const [currentSpeaker] = useParticipants();

  // Automatically route audio to speaker devices as relevant for watching videos.
  useIncallManager({ media: 'video', auto: true });

  const topViewProps: ViewerLiveStreamTopViewProps = {
    LiveIndicator,
    FollowerCount,
    DurationBadge,
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.static_grey },
        viewerLiveStream.container,
      ]}
    >
      <View style={[styles.view, viewerLiveStream.view]}>
        {ViewerLiveStreamTopView && (
          <ViewerLiveStreamTopView {...topViewProps} />
        )}
        <View
          style={[
            styles.floatingParticipantView,
            viewerLiveStream.floatingParticipantView,
          ]}
        >
          {hasOngoingScreenShare && FloatingParticipantView && (
            <FloatingParticipantView participant={currentSpeaker} />
          )}
        </View>

        {ViewerLiveStreamControls && (
          <ViewerLiveStreamControls
            ViewerLeaveStreamButton={ViewerLeaveStreamButton}
            onLeaveStreamHandler={onLeaveStreamHandler}
          />
        )}
      </View>
      {LiveStreamLayout && <LiveStreamLayout />}
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
