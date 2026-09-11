import React from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { Video, VideoSlash, ControlButtonIcon } from '../../../../icons';
import { CallControlsButton } from '..';

/**
 * Props for the Toggle Video preview button
 */
export type ToggleVideoPreviewButtonProps = {
  /**
   * Handler to be called when the the video preview button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * Button to toggle video mute/unmute status before joining the call.
 */
export const ToggleVideoPreviewButton = ({
  onPressHandler,
}: ToggleVideoPreviewButtonProps) => {
  const { useCameraState, useCallSettings } = useCallStateHooks();
  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;
  const { optimisticIsMute, camera } = useCameraState();
  const onPress = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    await camera.toggle();
  };

  if (!isVideoEnabledInCall) {
    return;
  }

  return (
    <CallControlsButton onPress={onPress} turnedOn={!optimisticIsMute}>
      <ControlButtonIcon
        icon={Video}
        iconOff={VideoSlash}
        turnedOn={!optimisticIsMute}
      />
    </CallControlsButton>
  );
};
