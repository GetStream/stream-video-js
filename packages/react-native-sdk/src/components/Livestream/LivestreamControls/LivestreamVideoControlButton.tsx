import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { useTheme } from '../../../contexts';
import { Pressable, StyleSheet, View } from 'react-native';
import { Video, VideoSlash } from '../../../icons';

/**
 * The LivestreamVideoControlButton controls the video stream publish/unpublish while in the livestream for the host.
 */
export const LivestreamVideoControlButton = () => {
  const call = useCall();
  const { useCameraState } = useCallStateHooks();
  const { status } = useCameraState();
  const {
    theme: {
      colors,
      variants: { iconSizes, buttonSizes },
      livestreamVideoControlButton,
    },
  } = useTheme();

  const onPress = async () => {
    await call?.camera.toggle();
  };

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.dark_gray,
          height: buttonSizes.xs,
          width: buttonSizes.xs,
        },
        livestreamVideoControlButton.container,
      ]}
    >
      {status === 'enabled' ? (
        <View
          style={[
            styles.icon,
            {
              height: iconSizes.sm,
              width: iconSizes.sm,
            },
            livestreamVideoControlButton.icon,
          ]}
        >
          <Video color={colors.static_white} />
        </View>
      ) : (
        <View
          style={[
            styles.icon,
            {
              height: iconSizes.sm,
              width: iconSizes.sm,
            },
            livestreamVideoControlButton.icon,
          ]}
        >
          <VideoSlash color={colors.static_white} />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  icon: {},
});
