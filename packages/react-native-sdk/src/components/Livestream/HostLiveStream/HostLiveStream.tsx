import { useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { StyleSheet, View, SafeAreaView } from 'react-native';
import { useTheme } from '../../../contexts';
import { useIncallManager } from '../../../hooks';
import {
  VideoRenderer as DefaultVideoRenderer,
  VideoRendererProps,
} from '../../Participant';
import {
  HostLiveStreamTopView as DefaultHostLiveStreamTopView,
  HostLiveStreamTopViewProps,
} from '../LiveStreamTopView/HostLiveStreamTopView';
import {
  HostLiveStreamControls as DefaultHostLiveStreamControls,
  HostLiveStreamControlsProps,
} from '../LiveStreamControls/HostLiveStreamControls';

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
     * Component to customize the bottom view controls at the host's live stream.
     */
    HostLiveStreamControls?: React.ComponentType<HostLiveStreamControlsProps> | null;
    VideoRenderer?: React.ComponentType<VideoRendererProps> | null;
  };

/**
 * The HostLiveStream component displays the UI for the Host's live stream.
 */
export const HostLiveStream = ({
  HostLiveStreamTopView = DefaultHostLiveStreamTopView,
  HostLiveStreamControls = DefaultHostLiveStreamControls,
  VideoRenderer = DefaultVideoRenderer,
  LiveIndicator,
  FollowerCount,
  DurationBadge,
  HostStartStreamButton,
  LiveStreamMediaControls,
  onEndStreamHandler,
  onStartStreamHandler,
}: HostLiveStreamProps) => {
  const { useLocalParticipant } = useCallStateHooks();
  const {
    theme: { colors },
  } = useTheme();

  const localParticipant = useLocalParticipant();

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
        styles.flexed,
        {
          backgroundColor: colors.static_grey,
        },
      ]}
    >
      {HostLiveStreamTopView && <HostLiveStreamTopView {...topViewProps} />}
      <View style={styles.flexed}>
        {localParticipant && VideoRenderer && (
          <VideoRenderer
            participant={localParticipant}
            trackType="videoTrack"
          />
        )}
      </View>
      {HostLiveStreamControls && (
        <HostLiveStreamControls
          onEndStreamHandler={onEndStreamHandler}
          onStartStreamHandler={onStartStreamHandler}
          HostStartStreamButton={HostStartStreamButton}
          LiveStreamMediaControls={LiveStreamMediaControls}
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
