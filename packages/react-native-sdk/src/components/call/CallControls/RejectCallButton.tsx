import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import React, { useCallback } from 'react';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../../../theme';
import { PhoneDown } from '../../../icons';
import { CallingState } from '@stream-io/video-client';

/**
 * The props for the Reject Call button.
 */
type RejectCallButtonProps = {
  /**
   * Handler to be called when the accept call button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
  /**
   * Handler to be called when the reject call button is pressed.
   *
   * Note: If the `onPressHandler` is passed this handler will not be executed.
   */
  onRejectHandler?: () => void;
};

/**
 * Button to reject a call.
 *
 * Mostly calls call.leave({ reject: true }) internally.
 */
export const RejectCallButton = ({
  onPressHandler,
  onRejectHandler,
}: RejectCallButtonProps) => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const rejectCallHandler = useCallback(async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    try {
      if (callingState === CallingState.LEFT) {
        return;
      }
      await call?.leave({ reject: true });
      if (onRejectHandler) {
        onRejectHandler();
      }
    } catch (error) {
      console.log('Error rejecting Call', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  return (
    <CallControlsButton
      onPress={rejectCallHandler}
      color={theme.light.error}
      style={theme.button.lg}
      svgContainerStyle={theme.icon.lg}
    >
      <PhoneDown color={theme.light.static_white} />
    </CallControlsButton>
  );
};
