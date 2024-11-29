import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import React, { useState } from 'react';
import { CallControlsButton } from './CallControlsButton';
import { IconWrapper, PhoneDown } from '../../../icons';
import { CallingState, getLogger } from '@stream-io/video-client';
import { useTheme } from '../../../contexts/ThemeContext';

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
  onRejectCallHandler?: () => void;
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
};

/**
 * Button to reject a call.
 *
 * Calls call.leave({ reject: true, reason: `OPTIONAL-REASON` }) internally.
 */
export const RejectCallButton = ({
  onPressHandler,
  onRejectCallHandler,
  size,
  rejectReason,
}: RejectCallButtonProps) => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const {
    theme: {
      colors,
      rejectCallButton,
      variants: { buttonSizes, iconSizes },
    },
  } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const rejectCallHandler = async () => {
    setIsLoading(true);
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    try {
      if (callingState === CallingState.LEFT) {
        return;
      }
      await call?.leave({ reject: true, reason: rejectReason });
      if (onRejectCallHandler) {
        onRejectCallHandler();
      }
    } catch (error) {
      const logger = getLogger(['RejectCallButton']);
      logger('error', 'Error rejecting Call', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CallControlsButton
      onPress={rejectCallHandler}
      color={colors.buttonWarning}
      size={size ?? buttonSizes.md}
      // TODO: check what to do about this random style prop
      // svgContainerStyle={theme.icon.lg}
      style={rejectCallButton}
      disabled={isLoading}
    >
      <IconWrapper>
        <PhoneDown color={colors.iconPrimary} size={iconSizes.lg} />
      </IconWrapper>
    </CallControlsButton>
  );
};
