import React from 'react';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../../../theme';
import { Video, VideoSlash } from '../../../icons';
import { useMediaStreamManagement } from '../../../providers';
import { useCameraState } from '@stream-io/video-react-bindings';

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
  const { toggleInitialVideoMuteState } = useMediaStreamManagement();
  const { status } = useCameraState();

  const VideoIcon =
    status === 'disabled' ? (
      <VideoSlash color={theme.light.static_white} />
    ) : (
      <Video color={theme.light.static_black} />
    );

  const toggleVideoPreviewHandler = () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    toggleInitialVideoMuteState();
  };

  return (
    <CallControlsButton
      onPress={toggleVideoPreviewHandler}
      color={
        status === 'enabled'
          ? theme.light.static_white
          : theme.light.static_black
      }
      style={[
        theme.button.md,
        {
          shadowColor:
            status === 'enabled'
              ? theme.light.static_white
              : theme.light.static_black,
        },
      ]}
    >
      {VideoIcon}
    </CallControlsButton>
  );
};
