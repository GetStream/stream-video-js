import React from 'react';
import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useCameraState,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { muteStatusColor } from '../../../utils';
import { theme } from '../../../theme';
import { Video, VideoSlash } from '../../../icons';

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
  const call = useCall();
  const { status } = useCameraState();

  const onPress = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    await call?.camera.toggle();
  };

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <CallControlsButton
        onPress={onPress}
        color={muteStatusColor(status === 'disabled')}
      >
        {status === 'disabled' ? (
          <VideoSlash color={theme.light.static_white} />
        ) : (
          <Video color={theme.light.static_black} />
        )}
      </CallControlsButton>
    </Restricted>
  );
};
