import React from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useCallStateHooks } from '@stream-io/video-react-bindings';
import { Mic, MicOff, ControlButtonIcon } from '../../../../icons';
import { CallControlsButton } from '..';

/**
 * Props for the Toggle Audio publishing button
 */
export type ToggleAudioPublishingButtonProps = {
  /**
   * Handler to be called when the the video publishing button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
  /**
   * Boolean to enable/disable the button
   */
  disabled?: boolean;
};

/**
 * Button to toggle audio mute/unmute status while in the call.
 */
export const ToggleAudioPublishingButton = ({
  onPressHandler,
  disabled,
}: ToggleAudioPublishingButtonProps) => {
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
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <CallControlsButton
        onPress={onPress}
        disabled={disabled}
        turnedOn={!optimisticIsMute}
      >
        <ControlButtonIcon
          icon={Mic}
          iconOff={MicOff}
          disabled={disabled}
          turnedOn={!optimisticIsMute}
        />
      </CallControlsButton>
    </Restricted>
  );
};
