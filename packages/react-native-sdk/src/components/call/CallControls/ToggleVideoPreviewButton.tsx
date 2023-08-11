import React from 'react';
import { useMediaStreamManagement } from '../../../providers';
import { ToggleVideoPublishingButton } from './ToggleVideoPublishingButton';

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

  const onPress = () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    toggleInitialVideoMuteState();
  };

  return <ToggleVideoPublishingButton onPressHandler={onPress} />;
};
