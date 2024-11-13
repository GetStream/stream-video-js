import { useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { useTheme } from '../../../contexts';
import { IconWrapper, Mic, MicOff } from '../../../icons';
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
      defaults,
    },
  } = useTheme();
  const { useMicrophoneState } = useCallStateHooks();
  const { optimisticIsMute, microphone } = useMicrophoneState();

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
      color={!optimisticIsMute ? colors.buttonSecondary : colors.buttonWarning}
      size={buttonSizes.md}
      style={{
        container: toggleAudioPreviewButton.container,
        svgContainer: toggleAudioPreviewButton.svgContainer,
      }}
    >
      <IconWrapper>
        {!optimisticIsMute ? (
          <Mic color={colors.iconPrimary} size={defaults.iconSize} />
        ) : (
          <MicOff color={colors.iconPrimary} size={defaults.iconSize} />
        )}
      </IconWrapper>
    </CallControlsButton>
  );
};
