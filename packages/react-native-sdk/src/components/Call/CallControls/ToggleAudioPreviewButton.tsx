import { useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { useTheme } from '../../../contexts';
import { Mic, MicOff } from '../../../icons';
import { CallControlsButton } from './CallControlsButton';

/**
 * Props for the Toggle Audio preview button
 */
export type ToggleAudioPreviewButtonProps = {
  /**
   * Handler to be called when the the audio preview button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * Button to toggle audio mute/unmute status before joining the call.
 */
export const ToggleAudioPreviewButton = ({
  onPressHandler,
}: ToggleAudioPreviewButtonProps) => {
  const {
    theme: {
      colors,
      toggleAudioPreviewButton,
      variants: { buttonSizes },
    },
  } = useTheme();
  const { useMicrophoneState } = useCallStateHooks();
  const { isMute, microphone } = useMicrophoneState();

  const onPress = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    await microphone.toggle();
  };

  return (
    <CallControlsButton
      onPress={onPress}
      color={!isMute ? colors.static_white : colors.static_black}
      size={buttonSizes.md}
      style={{
        container: {
          shadowColor: !isMute ? colors.static_white : colors.static_black,
          ...toggleAudioPreviewButton.container,
        },
        svgContainer: toggleAudioPreviewButton.svgContainer,
      }}
    >
      {!isMute ? (
        <Mic color={colors.static_black} />
      ) : (
        <MicOff color={colors.static_white} />
      )}
    </CallControlsButton>
  );
};
