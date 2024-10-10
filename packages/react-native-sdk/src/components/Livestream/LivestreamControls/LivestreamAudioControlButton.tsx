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
  const { optimisticIsMute, microphone } = useMicrophoneState();
  const {
    theme: {
      colors,
      variants: { iconSizes, buttonSizes },
      livestreamAudioControlButton,
      defaults,
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
          backgroundColor: colors.background2,
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
        {!optimisticIsMute ? (
          <Mic color={colors.base2} size={defaults.iconSize} />
        ) : (
          <MicOff color={colors.base1} size={defaults.iconSize} />
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
