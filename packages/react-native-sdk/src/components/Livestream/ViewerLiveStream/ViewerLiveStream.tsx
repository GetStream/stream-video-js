import React from 'react';

import { StyleSheet, SafeAreaView } from 'react-native';
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
  };

/**
 * The ViewerLiveStream component renders the UI for the Viewer's live stream.
 */
export const ViewerLiveStream = ({
  ViewerLiveStreamTopView = DefaultViewerLiveStreamTopView,
  ViewerLiveStreamControls = DefaultViewerLiveStreamControls,
  LiveStreamLayout = DefaultLiveStreamLayout,
  LiveIndicator,
  FollowerCount,
  DurationBadge,
  ViewerLeaveStreamButton,
  onLeaveStreamHandler,
}: ViewerLiveStreamProps) => {
  const {
    theme: { colors, viewerLiveStream },
  } = useTheme();

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
      {ViewerLiveStreamTopView && <ViewerLiveStreamTopView {...topViewProps} />}
      {LiveStreamLayout && <LiveStreamLayout />}
      {ViewerLiveStreamControls && (
        <ViewerLiveStreamControls
          ViewerLeaveStreamButton={ViewerLeaveStreamButton}
          onLeaveStreamHandler={onLeaveStreamHandler}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
