import React, { useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { CallingState, videoLoggerSystem } from '@stream-io/video-client';
import { CallControlsButton } from '..';
import { IconWrapper, PhoneDown } from '../../../../icons';
import { useTheme } from '../../../../contexts/ThemeContext';

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
  onRejectCallHandler?: (err?: Error) => void;
  /**
   * Sets the height, width and border-radius (half the value) of the button.
   */
  size?: React.ComponentProps<typeof CallControlsButton>['size'];
  /**
   * Optional: Reason for rejecting the call.
   * Pass a predefined or a custom reason.
   * There are four predefined reasons for rejecting the call:
    - `busy` - when the callee is busy and cannot accept the call.
    - `decline` - when the callee intentionally declines the call.
    - `cancel` - when the caller cancels the call.
    - `timeout` - when the **caller** or **callee** rejects the call after `auto_cancel_timeout_ms` or `incoming_call_timeout_ms` accordingly.
   */
  rejectReason?: string;
  /**
   * Whether the button is disabled.
   */
  disabled?: boolean;
};

/**
 * Button to reject a call.
 *
 * Calls call.leave({ reject: true, reason: `OPTIONAL-REASON` }) internally.
 */
export const RejectCallButton = ({
  onPressHandler,
  onRejectCallHandler,
  rejectReason,
  disabled = false,
}: RejectCallButtonProps) => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const {
    theme: { rejectCallButton, semantics, components },
  } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const rejectCallHandler = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    if (!call || callingState === CallingState.LEFT) {
      return;
    }
    setIsLoading(true);
    try {
      await call.leave({ reject: true, reason: rejectReason });
      onRejectCallHandler?.();
    } catch (error) {
      const logger = videoLoggerSystem.getLogger('RejectCallButton');
      logger.error('Error rejecting Call', error);
      onRejectCallHandler?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CallControlsButton
      onPress={rejectCallHandler}
      color={semantics.buttonDestructiveBg}
      disabled={isLoading || disabled}
      style={rejectCallButton}
    >
      <IconWrapper>
        <PhoneDown
          color={semantics.buttonDestructiveTextOnAccent}
          size={components.iconSizeLg}
        />
      </IconWrapper>
    </CallControlsButton>
  );
};
