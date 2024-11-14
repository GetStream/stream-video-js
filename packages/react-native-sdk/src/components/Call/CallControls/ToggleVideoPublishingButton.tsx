import React from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useCallStateHooks } from '@stream-io/video-react-bindings';
import { CallControlsButton } from './CallControlsButton';
import { IconWrapper, Video, VideoSlash } from '../../../icons';
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
  const { useCameraState, useCallSettings } = useCallStateHooks();
  const { camera, optimisticIsMute } = useCameraState();
  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;
  const {
    theme: { colors, variants },
  } = useTheme();
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
      <CallControlsButton
        onPress={onPress}
        color={
          !optimisticIsMute ? colors.buttonSecondary : colors.buttonWarning
        }
      >
        <IconWrapper>
          {!optimisticIsMute ? (
            <Video color={colors.iconPrimary} size={variants.iconSizes.md} />
          ) : (
            <VideoSlash
              color={colors.iconPrimary}
              size={variants.iconSizes.md}
            />
          )}
        </IconWrapper>
      </CallControlsButton>
    </Restricted>
  );
};
