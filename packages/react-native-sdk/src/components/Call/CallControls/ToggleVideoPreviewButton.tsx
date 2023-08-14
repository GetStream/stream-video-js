import React from 'react';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../../../theme';
import { Video, VideoSlash } from '../../../icons';
import { useMediaStreamManagement } from '../../../providers';

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
  const { initialVideoEnabled, toggleInitialVideoMuteState } =
    useMediaStreamManagement();

  const VideoIcon = !initialVideoEnabled ? (
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
        initialVideoEnabled
          ? theme.light.static_white
          : theme.light.static_black
      }
      style={[
        theme.button.md,
        {
          shadowColor: initialVideoEnabled
            ? theme.light.static_white
            : theme.light.static_black,
        },
      ]}
    >
      {VideoIcon}
    </CallControlsButton>
  );
};
