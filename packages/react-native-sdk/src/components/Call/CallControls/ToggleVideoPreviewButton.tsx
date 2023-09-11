import React from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useMediaStreamManagement } from '../../../providers';
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
  const { toggleInitialVideoMuteState } = useMediaStreamManagement();
  const { useCameraState } = useCallStateHooks();
  const { status } = useCameraState();
  const onPress = () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    toggleInitialVideoMuteState();
  };

  console.log({ status });

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
