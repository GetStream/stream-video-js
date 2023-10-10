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
};

/**
 * The HostLiveStreamControls component displays the call controls for the live stream at host's end.
 */
export const HostLiveStreamControls = ({
  HostStartStreamButton = DefaultHostStartStreamButton,
  LiveStreamMediaControls = DefaultLiveStreamMediaControls,
  onEndStreamHandler,
  onStartStreamHandler,
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
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    zIndex: 1,
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
