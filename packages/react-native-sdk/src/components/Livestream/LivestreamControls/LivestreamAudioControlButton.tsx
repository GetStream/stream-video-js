import { useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { useTheme } from '../../../contexts';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconWrapper, Mic, MicOff } from '../../../icons';

/**
 * The LivestreamAudioControlButton controls the audio stream publish/unpublish while in the livestream for the host.
 */
export const LivestreamAudioControlButton = () => {
  const { useMicrophoneState } = useCallStateHooks();
  const { optimisticIsMute, microphone } = useMicrophoneState();
  const {
    theme: {
      colors,
      variants: { iconSizes, buttonSizes },
      livestreamAudioControlButton,
    },
  } = useTheme();

  const onPress = async () => {
    await microphone.toggle();
  };

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
        livestreamAudioControlButton.container,
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            height: iconSizes.sm,
            width: iconSizes.sm,
          },
          livestreamAudioControlButton.icon,
        ]}
      >
        <IconWrapper>
          {!optimisticIsMute ? (
            <Mic color={colors.iconPrimary} size={iconSizes.md} />
          ) : (
            <MicOff color={colors.iconPrimary} size={iconSizes.md} />
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
