import React from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts';
import { CallControlsButton } from './CallControlsButton';
import { Video, VideoSlash } from '../../../icons';

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
  const {
    theme: {
      colors,
      toggleVideoPreviewButton,
      variants: { buttonSizes },
    },
  } = useTheme();
  const { useCameraState, useCallSettings } = useCallStateHooks();
  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;
  const { isMute, camera } = useCameraState();
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
    <CallControlsButton
      onPress={onPress}
      color={!isMute ? colors.static_white : colors.static_black}
      size={buttonSizes.md}
      style={{
        container: {
          shadowColor: !isMute ? colors.static_white : colors.static_black,
          ...toggleVideoPreviewButton.container,
        },
        svgContainer: toggleVideoPreviewButton.svgContainer,
      }}
    >
      {!isMute ? (
        <Video color={colors.static_black} />
      ) : (
        <VideoSlash color={colors.static_white} />
      )}
    </CallControlsButton>
  );
};
