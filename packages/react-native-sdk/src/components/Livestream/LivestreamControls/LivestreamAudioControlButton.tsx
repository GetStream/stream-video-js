import { useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { Mic, MicOff, ControlButtonIcon } from '../../../icons';
import { CallControlsButton } from '../../Call/CallControls/Buttons/CallControlsButton';

/**
 * The LivestreamAudioControlButton controls the audio stream publish/unpublish while in the livestream for the host.
 */
export const LivestreamAudioControlButton = () => {
  const { useMicrophoneState } = useCallStateHooks();
  const { optimisticIsMute, microphone } = useMicrophoneState();

  const onPress = async () => {
    await microphone.toggle();
  };

  return (
    <CallControlsButton onPress={onPress}>
      <ControlButtonIcon
        icon={optimisticIsMute ? MicOff : Mic}
        disabled={optimisticIsMute}
      />
    </CallControlsButton>
  );
};
