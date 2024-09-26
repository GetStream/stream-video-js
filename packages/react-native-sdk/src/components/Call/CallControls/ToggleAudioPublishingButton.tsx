import React from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useCallStateHooks } from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { Mic, MicOff } from '../../../icons';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Props for the Toggle Audio publishing button
 */
export type ToggleAudioPublishingButtonProps = {
  /**
   * Handler to be called when the the video publishing button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * Button to toggle audio mute/unmute status while in the call.
 */
export const ToggleAudioPublishingButton = ({
  onPressHandler,
}: ToggleAudioPublishingButtonProps) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { optimisticIsMute, microphone } = useMicrophoneState();

  const {
    theme: { colors, toggleAudioPublishingButton },
  } = useTheme();
  const onPress = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }

    await microphone.toggle();
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <CallControlsButton
        onPress={onPress}
        color={!optimisticIsMute ? colors.static_white : colors.overlay_medium}
        style={toggleAudioPublishingButton}
      >
        {!optimisticIsMute ? (
          <Mic color={colors.static_black} />
        ) : (
          <MicOff color={colors.static_white} />
        )}
      </CallControlsButton>
    </Restricted>
  );
};
