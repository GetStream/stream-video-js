import { useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { useTheme } from '../../../contexts';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconWrapper, Video, VideoSlash } from '../../../icons';

/**
 * The LivestreamVideoControlButton controls the video stream publish/unpublish while in the livestream for the host.
 */
export const LivestreamVideoControlButton = () => {
  const { useCameraState, useCallSettings } = useCallStateHooks();
  const { optimisticIsMute, camera } = useCameraState();
  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;
  const {
    theme: {
      colors,
      variants: { iconSizes, buttonSizes },
      livestreamVideoControlButton,
    },
  } = useTheme();

  const onPress = async () => {
    await camera.toggle();
  };

  if (!isVideoEnabledInCall) {
    return;
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.buttonSecondary,
          height: buttonSizes.xs,
          width: buttonSizes.xs,
        },
        livestreamVideoControlButton.container,
      ]}
    >
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
        <IconWrapper>
          {!optimisticIsMute ? (
            <Video color={colors.iconPrimary} size={iconSizes.md} />
          ) : (
            <VideoSlash color={colors.iconPrimary} size={iconSizes.md} />
          )}
        </IconWrapper>
      </View>
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
