import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  HostStartStreamButton as DefaultHostStartStreamButton,
  HostStartStreamButtonProps,
} from './HostStartStreamButton';
import {
  LiveStreamMediaControls as DefaultLiveStreamMediaControls,
  LiveStreamMediaControlsProps,
} from './LiveStreamMediaControls';
import { useTheme } from '../../../contexts';
import { Z_INDEX } from '../../../constants';

/**
 * Props for the HostLiveStreamControls component.
 */
export type HostLiveStreamControlsProps = HostStartStreamButtonProps & {
  /**
   * Component to customize the host's start/end live stream button.
   */
  HostStartStreamButton?: React.ComponentType<HostStartStreamButtonProps> | null;
  /**
   * Component to customize the host's media control(audio/video) buttons.
   */
  LiveStreamMediaControls?: React.ComponentType<LiveStreamMediaControlsProps> | null;
  /**
   * Enable HTTP live streaming
   */
  hls?: boolean;
};

/**
 * The HostLiveStreamControls component displays the call controls for the live stream at host's end.
 */
export const HostLiveStreamControls = ({
  HostStartStreamButton = DefaultHostStartStreamButton,
  LiveStreamMediaControls = DefaultLiveStreamMediaControls,
  onEndStreamHandler,
  onStartStreamHandler,
  hls = false,
}: HostLiveStreamControlsProps) => {
  const {
    theme: { colors, hostLiveStreamControls },
  } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.static_overlay },
        hostLiveStreamControls.container,
      ]}
    >
      <View style={[styles.leftElement, hostLiveStreamControls.leftElement]}>
        {HostStartStreamButton && (
          <HostStartStreamButton
            onEndStreamHandler={onEndStreamHandler}
            onStartStreamHandler={onStartStreamHandler}
            hls={hls}
          />
        )}
      </View>
      <View style={[styles.rightElement, hostLiveStreamControls.rightElement]}>
        {LiveStreamMediaControls && <LiveStreamMediaControls />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    zIndex: Z_INDEX.IN_FRONT,
  },
  leftElement: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightElement: {
    flex: 1,
    alignItems: 'flex-end',
  },
});
