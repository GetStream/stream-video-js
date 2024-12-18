import { useCall } from '@stream-io/video-react-bindings';
import { getLogger } from '@stream-io/video-client';
import React, { useState } from 'react';
import { CallControlsButton } from './CallControlsButton';
import { IconWrapper, Phone } from '../../../icons';
import { useTheme } from '../../../contexts/ThemeContext';

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
  onAcceptCallHandler?: () => void;
};

/**
 * Button to accept a call.
 *
 * Mostly calls call.join() internally.
 */
export const AcceptCallButton = ({
  onPressHandler,
  onAcceptCallHandler,
}: AcceptCallButtonProps) => {
  const call = useCall();
  const {
    theme: {
      colors,
      variants: { buttonSizes, iconSizes },
      acceptCallButton,
    },
  } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const acceptCallHandler = async () => {
    setIsLoading(true);
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    try {
      await call?.join();
      if (onAcceptCallHandler) {
        onAcceptCallHandler();
      }
    } catch (error) {
      const logger = getLogger(['AcceptCallButton']);
      logger('error', 'Error joining Call', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CallControlsButton
      onPress={acceptCallHandler}
      color={colors.buttonSuccess}
      size={buttonSizes.md}
      style={acceptCallButton}
      disabled={isLoading}
    >
      <IconWrapper>
        <Phone color={colors.iconPrimary} size={iconSizes.lg} />
      </IconWrapper>
    </CallControlsButton>
  );
};
