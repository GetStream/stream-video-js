import { useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { Mic, MicOff, ControlButtonIcon } from '../../../../icons';
import { CallControlsButton } from './CallControlsButton';
import { ButtonTestIds } from '../../../../constants/TestIds';

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
      testID={
        optimisticIsMute
          ? ButtonTestIds.MICROPHONE_DISABLED
          : ButtonTestIds.MICROPHONE_ENABLED
      }
      turnedOn={!optimisticIsMute}
    >
      <ControlButtonIcon
        icon={Mic}
        iconOff={MicOff}
        turnedOn={!optimisticIsMute}
      />
    </CallControlsButton>
  );
};
