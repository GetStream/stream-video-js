import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../../contexts';
import { useIncallManager } from '../../../hooks';
import {
  HostLiveStreamTopView as DefaultHostLiveStreamTopView,
  HostLiveStreamTopViewProps,
} from '../LiveStreamTopView/HostLiveStreamTopView';
import {
  HostLiveStreamControls as DefaultHostLiveStreamControls,
  HostLiveStreamControlsProps,
} from '../LiveStreamControls/HostLiveStreamControls';
import {
  LiveStreamLayout as DefaultLiveStreamLayout,
  LiveStreamLayoutProps,
} from '../LiveStreamLayout';

/**
 * Props for the HostLiveStream component.
 */
export type HostLiveStreamProps = HostLiveStreamTopViewProps &
  HostLiveStreamControlsProps & {
    /**
     * Component to customize the top view at the host's live stream.
     */
    HostLiveStreamTopView?: React.ComponentType<HostLiveStreamTopViewProps> | null;
    /**
     * Component to customize the live stream video layout.
     */
    LiveStreamLayout?: React.ComponentType<LiveStreamLayoutProps> | null;
    /**
     * Component to customize the bottom view controls at the host's live stream.
     */
    HostLiveStreamControls?: React.ComponentType<HostLiveStreamControlsProps> | null;
    /**
     * Enable HTTP live streaming
     */
    hls?: boolean;
  };

/**
 * The HostLiveStream component displays the UI for the Host's live stream.
 */
export const HostLiveStream = ({
  HostLiveStreamTopView = DefaultHostLiveStreamTopView,
  HostLiveStreamControls = DefaultHostLiveStreamControls,
  LiveStreamLayout = DefaultLiveStreamLayout,
  LiveIndicator,
  FollowerCount,
  DurationBadge,
  HostStartStreamButton,
  LiveStreamMediaControls,
  onEndStreamHandler,
  onStartStreamHandler,
  hls = false,
}: HostLiveStreamProps) => {
  const {
    theme: { colors, hostLiveStream },
  } = useTheme();

  // Automatically route audio to speaker devices as relevant for watching videos.
  useIncallManager({ media: 'video', auto: true });

  const topViewProps: HostLiveStreamTopViewProps = {
    LiveIndicator,
    FollowerCount,
    DurationBadge,
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: colors.static_grey,
        },
        hostLiveStream.container,
      ]}
    >
      {HostLiveStreamTopView && <HostLiveStreamTopView {...topViewProps} />}
      {LiveStreamLayout && <LiveStreamLayout />}
      {HostLiveStreamControls && (
        <HostLiveStreamControls
          onEndStreamHandler={onEndStreamHandler}
          onStartStreamHandler={onStartStreamHandler}
          HostStartStreamButton={HostStartStreamButton}
          LiveStreamMediaControls={LiveStreamMediaControls}
          hls={hls}
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
