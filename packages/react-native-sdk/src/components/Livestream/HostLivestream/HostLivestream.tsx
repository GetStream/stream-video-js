import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '../../../contexts';
import { useIncallManager } from '../../../hooks';
import {
  HostLivestreamTopView as DefaultHostLivestreamTopView,
  HostLivestreamTopViewProps,
} from '../LivestreamTopView/HostLivestreamTopView';
import {
  HostLivestreamControls as DefaultHostLivestreamControls,
  HostLivestreamControlsProps,
} from '../LivestreamControls/HostLivestreamControls';
import {
  LivestreamLayout as DefaultLivestreamLayout,
  LivestreamLayoutProps,
} from '../LivestreamLayout';

/**
 * Props for the HostLiveStream component.
 */
export type HostLivestreamProps = HostLivestreamTopViewProps &
  HostLivestreamControlsProps & {
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
     * Enable HTTP live streaming
     */
    hls?: boolean;
  };

/**
 * The HostLiveStream component displays the UI for the Host's live stream.
 */
export const HostLivestream = ({
  HostLivestreamTopView = DefaultHostLivestreamTopView,
  HostLivestreamControls = DefaultHostLivestreamControls,
  LivestreamLayout = DefaultLivestreamLayout,
  LiveIndicator,
  FollowerCount,
  DurationBadge,
  HostStartStreamButton,
  LivestreamMediaControls,
  onEndStreamHandler,
  onStartStreamHandler,
  hls = false,
}: HostLivestreamProps) => {
  const {
    theme: { colors, hostLiveStream },
  } = useTheme();

  // Automatically route audio to speaker devices as relevant for watching videos.
  useIncallManager({ media: 'video', auto: true });

  const topViewProps: HostLivestreamTopViewProps = {
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
      {HostLivestreamTopView && <HostLivestreamTopView {...topViewProps} />}
      {LivestreamLayout && <LivestreamLayout />}
      {HostLivestreamControls && (
        <HostLivestreamControls
          onEndStreamHandler={onEndStreamHandler}
          onStartStreamHandler={onStartStreamHandler}
          HostStartStreamButton={HostStartStreamButton}
          LivestreamMediaControls={LivestreamMediaControls}
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
