import React from 'react';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../../../theme';
import { Mic, MicOff } from '../../../icons';
import { useMediaStreamManagement } from '../../../providers';
import { useCameraState, useMicrophoneState } from '@stream-io/video-react-bindings';

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
  const { toggleInitialAudioMuteState } = useMediaStreamManagement();
  const { status } = useMicrophoneState();

  const MicIcon =
    status === 'disabled' ? (
      <MicOff color={theme.light.static_white} />
    ) : (
      <Mic color={theme.light.static_black} />
    );

  const toggleAudioPreviewHandler = () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    toggleInitialAudioMuteState();
  };

  return (
    <CallControlsButton
      onPress={toggleAudioPreviewHandler}
      color={
        status === 'enabled'
          ? theme.light.static_white
          : theme.light.static_black
      }
      style={[
        theme.button.md,
        {
          shadowColor:
            status === 'enabled'
              ? theme.light.static_white
              : theme.light.static_black,
        },
      ]}
    >
      {MicIcon}
    </CallControlsButton>
  );
};
