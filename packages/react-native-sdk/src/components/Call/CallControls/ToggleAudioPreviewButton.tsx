import React from 'react';
import { useMediaStreamManagement } from '../../../providers';
import { ToggleAudioPublishingButton } from './ToggleAudioPublishingButton';

/**
 * Props for the Toggle Audio preview button
 */
export type ToggleAudioPreviewButtonProps = {
  /**
   * Handler to be called when the the audio preview button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * Button to toggle audio mute/unmute status before joining the call.
 */
export const ToggleAudioPreviewButton = ({
  onPressHandler,
}: ToggleAudioPreviewButtonProps) => {
  const { toggleInitialAudioMuteState } = useMediaStreamManagement();

  const onPress = () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    toggleInitialAudioMuteState();
  };

  return <ToggleAudioPublishingButton onPressHandler={onPress} />;
};
