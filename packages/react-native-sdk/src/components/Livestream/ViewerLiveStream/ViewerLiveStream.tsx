import React from 'react';

import { StyleSheet, View, SafeAreaView } from 'react-native';
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
import { CallParticipantsGrid } from '../../Call';

/**
 * Props for the ViewerLiveStream component.
 */
export type ViewerLiveStreamProps = ViewerLiveStreamTopViewProps &
  ViewerLiveStreamControlsProps &
  ViewerLeaveStreamButtonProps & {
    ViewerLiveStreamTopView?: React.ComponentType<ViewerLiveStreamTopViewProps> | null;
    ViewerLiveStreamControls?: React.ComponentType<ViewerLiveStreamControlsProps> | null;
  };

/**
 * The ViewerLiveStream component renders the UI for the Viewer's live stream.
 */
export const ViewerLiveStream = ({
  ViewerLiveStreamTopView = DefaultViewerLiveStreamTopView,
  ViewerLiveStreamControls = DefaultViewerLiveStreamControls,
  LiveIndicator,
  FollowerCount,
  DurationBadge,
  ViewerLeaveStreamButton,
  onLeaveStreamHandler,
}: ViewerLiveStreamProps) => {
  const {
    theme: { colors },
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
      style={[styles.flexed, { backgroundColor: colors.static_grey }]}
    >
      {ViewerLiveStreamTopView && <ViewerLiveStreamTopView {...topViewProps} />}
      <View style={styles.flexed}>
        <CallParticipantsGrid />
      </View>
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
  flexed: {
    flex: 1,
  },
});
