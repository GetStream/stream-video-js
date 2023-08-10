import { useCall } from '@stream-io/video-react-bindings';
import React, { useCallback } from 'react';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../../../theme';
import { Phone } from '../../../icons';

/**
 * The props for the Accept Call button.
 */
type AcceptCallButtonProps = {
  /**
   * Handler to be called when the accept call button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
  /**
   *  Handler to be called after the incoming call is accepted.
   */
  onAcceptHandler?: () => void;
};

/**
 * Button to accept a call.
 *
 * Mostly calls call.join() internally.
 */
export const AcceptCallButton = ({
  onPressHandler,
  onAcceptHandler,
}: AcceptCallButtonProps) => {
  const call = useCall();
  const acceptCallHandler = useCallback(async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    try {
      await call?.join();
      if (onAcceptHandler) {
        onAcceptHandler();
      }
    } catch (error) {
      console.log('Error joining Call', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  return (
    <CallControlsButton
      onPress={acceptCallHandler}
      color={theme.light.info}
      style={theme.button.lg}
      svgContainerStyle={theme.icon.lg}
    >
      <Phone color={theme.light.static_white} />
    </CallControlsButton>
  );
};
