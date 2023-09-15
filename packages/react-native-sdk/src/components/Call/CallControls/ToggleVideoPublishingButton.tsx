import React from 'react';
import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { Video, VideoSlash } from '../../../icons';
import { useTheme } from '../../../contexts/ThemeContext';

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
  const { useCameraState } = useCallStateHooks();
  const { status } = useCameraState();
  const {
    theme: { colors },
  } = useTheme();
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
        color={status === 'enabled' ? colors.static_white : colors.overlay_dark}
      >
        {status === 'enabled' ? (
          <Video color={colors.static_black} />
        ) : (
          <VideoSlash color={colors.static_white} />
        )}
      </CallControlsButton>
    </Restricted>
  );
};
