import React, { useState } from 'react';
import { useCall } from '@stream-io/video-react-bindings';
import { videoLoggerSystem } from '@stream-io/video-client';
import { useTheme } from '../../../../contexts/ThemeContext';
import { IconWrapper, Phone } from '../../../../icons';
import { CallControlsButton } from '..';

/**
 * The props for the Accept Call button.
 */
type AcceptCallButtonProps = {
  /**
   * Handler to be called when the accept call button is pressed.
   */
  onPressHandler?: () => void;
  /**
   * Handler to be called after the incoming call is accepted.
   *
   * Note: If the `onPressHandler` is passed this handler will not be executed.
   */
  onAcceptCallHandler?: (err?: Error) => void;
  /**
   * Whether the button is disabled.
   */
  disabled?: boolean;
};

/**
 * Button to accept a call.
 *
 * Mostly calls call.join() internally.
 */
export const AcceptCallButton = ({
  onPressHandler,
  onAcceptCallHandler,
  disabled = false,
}: AcceptCallButtonProps) => {
  const call = useCall();
  const {
    theme: { acceptCallButton, semantics, components },
  } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const acceptCallHandler = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    if (!call) return;
    setIsLoading(true);
    try {
      await call.join();
      onAcceptCallHandler?.();
    } catch (error) {
      const logger = videoLoggerSystem.getLogger('AcceptCallButton');
      logger.error('Error joining Call', error);
      onAcceptCallHandler?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CallControlsButton
      onPress={acceptCallHandler}
      color={semantics.controlAcceptCallButtonBg}
      disabled={isLoading || disabled}
      style={acceptCallButton}
    >
      <IconWrapper>
        <Phone
          color={semantics.controlAcceptCallButtonText}
          size={components.iconSizeLg}
        />
      </IconWrapper>
    </CallControlsButton>
  );
};
