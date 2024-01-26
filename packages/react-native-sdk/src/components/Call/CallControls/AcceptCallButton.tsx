import { useCall } from '@stream-io/video-react-bindings';
import React from 'react';
import { CallControlsButton } from './CallControlsButton';
import { Phone } from '../../../icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { Platform } from 'react-native';
import notifee from '@notifee/react-native';

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
      variants: { buttonSizes },
      acceptCallButton,
    },
  } = useTheme();
  const acceptCallHandler = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    try {
      if (Platform.OS === 'android' && call?.cid) {
        notifee.cancelDisplayedNotification(call?.cid);
      }
      await call?.join();
      if (onAcceptCallHandler) {
        onAcceptCallHandler();
      }
    } catch (error) {
      console.log('Error joining Call', error);
    }
  };

  return (
    <CallControlsButton
      onPress={acceptCallHandler}
      color={colors.info}
      size={buttonSizes.lg}
      style={acceptCallButton}
    >
      <Phone color={colors.static_white} />
    </CallControlsButton>
  );
};
