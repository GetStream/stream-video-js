import React from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
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
  const call = useCall();
  const { useCameraState } = useCallStateHooks();
  const { status } = useCameraState();
  const onPress = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    await call?.camera.toggle();
  };

  return (
    <CallControlsButton
      onPress={onPress}
      color={status === 'enabled' ? colors.static_white : colors.static_black}
      size={buttonSizes.md}
      style={{
        container: {
          shadowColor:
            status === 'enabled' ? colors.static_white : colors.static_black,
          ...toggleVideoPreviewButton.container,
        },
        svgContainer: toggleVideoPreviewButton.svgContainer,
      }}
    >
      {status === 'enabled' ? (
        <Video color={colors.static_black} />
      ) : (
        <VideoSlash color={colors.static_white} />
      )}
    </CallControlsButton>
  );
};
