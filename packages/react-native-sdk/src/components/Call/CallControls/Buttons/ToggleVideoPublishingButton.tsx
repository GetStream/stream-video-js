import React from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useCallStateHooks } from '@stream-io/video-react-bindings';
import { Video, VideoSlash, ControlButtonIcon } from '../../../../icons';
import { CallControlsButton } from '..';

/**
 * Props for the Toggle Video publishing button
 */
export type ToggleVideoPublishingButtonProps = {
  /**
   * Handler to be called when the the video publishing button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * Button to toggle video mute/unmute status while in the call.
 */
export const ToggleVideoPublishingButton = ({
  onPressHandler,
}: ToggleVideoPublishingButtonProps) => {
  const { useCameraState, useCallSettings } = useCallStateHooks();
  const { camera, optimisticIsMute } = useCameraState();
  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;
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
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <CallControlsButton onPress={onPress} turnedOn={!optimisticIsMute}>
        <ControlButtonIcon
          icon={Video}
          iconOff={VideoSlash}
          turnedOn={!optimisticIsMute}
        />
      </CallControlsButton>
    </Restricted>
  );
};
