import { useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { Video, VideoSlash, ControlButtonIcon } from '../../../icons';
import { CallControlsButton } from '../../Call/CallControls/Buttons/CallControlsButton';

/**
 * The LivestreamVideoControlButton controls the video stream publish/unpublish while in the livestream for the host.
 */
export const LivestreamVideoControlButton = () => {
  const { useCameraState, useCallSettings } = useCallStateHooks();
  const { optimisticIsMute, camera } = useCameraState();
  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;

  const onPress = async () => {
    await camera.toggle();
  };

  if (!isVideoEnabledInCall) {
    return;
  }

  return (
    <CallControlsButton onPress={onPress}>
      <ControlButtonIcon
        icon={optimisticIsMute ? VideoSlash : Video}
        disabled={optimisticIsMute}
      />
    </CallControlsButton>
  );
};
