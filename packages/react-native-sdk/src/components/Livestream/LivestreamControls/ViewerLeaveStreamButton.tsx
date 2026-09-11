import React, { useState } from 'react';
import { useCall } from '@stream-io/video-react-bindings';
import { videoLoggerSystem } from '@stream-io/video-client';
import { PhoneDown, ControlButtonIcon } from '../../../icons';
import { CallControlsButton } from '../../Call/CallControls/Buttons/CallControlsButton';

/**
 * Props for the ViewerLeaveStreamButton component.
 */
export type ViewerLeaveStreamButtonProps = {
  /**
   * Handler to be called when the viewer's leave stream button is called.
   * @returns void
   */
  onLeaveStreamHandler?: () => void;
};

/**
 * The ViewerLeaveStreamButton component displays and controls the leave stream logic of the viewer's live stream.
 */
export const ViewerLeaveStreamButton = ({
  onLeaveStreamHandler,
}: ViewerLeaveStreamButtonProps) => {
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const call = useCall();

  const onLeaveStreamButtonPress = async () => {
    if (onLeaveStreamHandler) {
      onLeaveStreamHandler();
      return;
    }
    try {
      setIsAwaitingResponse(true);
      await call?.leave();
      setIsAwaitingResponse(false);
    } catch (error) {
      const logger = videoLoggerSystem.getLogger('ViewerLeaveStreamButton');
      logger.error('Error stopping livestream', error);
    }
  };

  return (
    <CallControlsButton
      onPress={onLeaveStreamButtonPress}
      disabled={isAwaitingResponse}
    >
      <ControlButtonIcon icon={PhoneDown} disabled={isAwaitingResponse} />
    </CallControlsButton>
  );
};
