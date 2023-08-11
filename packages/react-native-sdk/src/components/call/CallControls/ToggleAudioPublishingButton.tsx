import React from 'react';
import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useMicrophoneState,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../../../theme';
import { Mic, MicOff } from '../../../icons';
import { muteStatusColor } from '../../../utils';

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
  const call = useCall();
  const { status } = useMicrophoneState();

  const onPress = async () => {
    onPressHandler?.();
    await call?.microphone.toggle();
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <CallControlsButton
        onPress={onPress}
        color={muteStatusColor(status === 'disabled')}
      >
        {status === 'disabled' ? (
          <MicOff color={theme.light.static_white} />
        ) : (
          <Mic color={theme.light.static_black} />
        )}
      </CallControlsButton>
    </Restricted>
  );
};
