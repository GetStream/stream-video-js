import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  HostStartStreamButton as DefaultHostStartStreamButton,
  HostStartStreamButtonProps,
} from './HostStartStreamButton';
import {
  LivestreamMediaControls as DefaultLivestreamMediaControls,
  LivestreamMediaControlsProps,
} from './LivestreamMediaControls';
import { useTheme } from '../../../contexts';
import { Z_INDEX } from '../../../constants';

/**
 * Props for the HostLivestreamControls component.
 */
export type HostLivestreamControlsProps = HostStartStreamButtonProps & {
  /**
   * Component to customize the host's start/end live stream button.
   */
  HostStartStreamButton?: React.ComponentType<HostStartStreamButtonProps> | null;
  /**
   * Component to customize the host's media control(audio/video) buttons.
   */
  LivestreamMediaControls?: React.ComponentType<LivestreamMediaControlsProps> | null;
  /**
   * Enable HTTP live streaming
   */
  hls?: boolean;
};

/**
 * The HostLivestreamControls component displays the call controls for the live stream at host's end.
 */
export const HostLivestreamControls = ({
  HostStartStreamButton = DefaultHostStartStreamButton,
  LivestreamMediaControls = DefaultLivestreamMediaControls,
  onEndStreamHandler,
  onStartStreamHandler,
  hls = false,
}: HostLivestreamControlsProps) => {
  const {
    theme: { colors, hostLivestreamControls },
  } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.static_overlay },
        hostLivestreamControls.container,
      ]}
    >
      <View style={[styles.leftElement, hostLivestreamControls.leftElement]}>
        {HostStartStreamButton && (
          <HostStartStreamButton
            onEndStreamHandler={onEndStreamHandler}
            onStartStreamHandler={onStartStreamHandler}
            hls={hls}
          />
        )}
      </View>
      <View style={[styles.rightElement, hostLivestreamControls.rightElement]}>
        {LivestreamMediaControls && <LivestreamMediaControls />}
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
