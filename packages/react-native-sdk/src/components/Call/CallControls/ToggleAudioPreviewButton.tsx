import { useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { useTheme } from '../../../contexts';
import { Mic, MicOff } from '../../../icons';
import { useMediaStreamManagement } from '../../../providers';
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
  const { status } = useMicrophoneState();

  const { toggleInitialAudioMuteState } = useMediaStreamManagement();

  const onPress = () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    toggleInitialAudioMuteState();
  };

  return (
    <CallControlsButton
      onPress={onPress}
      color={status === 'enabled' ? colors.static_white : colors.static_black}
      size={buttonSizes.md}
      style={{
        container: {
          shadowColor:
            status === 'enabled' ? colors.static_white : colors.static_black,
          ...toggleAudioPreviewButton.container,
        },
        svgContainer: toggleAudioPreviewButton.svgContainer,
      }}
    >
      {status === 'disabled' ? (
        <MicOff color={colors.static_white} />
      ) : (
        <Mic color={colors.static_black} />
      )}
    </CallControlsButton>
  );
};
