import { useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { useTheme } from '../../../contexts';
import { Pressable, StyleSheet, View } from 'react-native';
import { Mic, MicOff } from '../../../icons';

/**
 * The LivestreamAudioControlButton controls the audio stream publish/unpublish while in the livestream for the host.
 */
export const LivestreamAudioControlButton = () => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isMute, microphone } = useMicrophoneState();
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
          backgroundColor: colors.dark_gray,
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
        {!isMute ? (
          <Mic color={colors.static_white} />
        ) : (
          <MicOff color={colors.static_white} />
        )}
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
