import React from 'react';
import { CallControlsButton } from './CallControlsButton';
import { PhoneDown } from '../../../icons';
import { ButtonTestIds } from '../../../constants/TestIds';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * The props for the Hang up call button in the Call Controls.
 */
export type HangUpCallButtonProps = {
  /**
   * Handler to override the hang up handler when the hangup button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
  /**
   * Handler to be called when the call is hanged up.
   *
   * Note: If the `onPressHandler` is passed this handler will not be executed.
   */
  onHangupCallHandler?: () => void;
};

/**
 * Button to hangup a call.
 *
 * Mostly calls call.leave() internally.
 */
export const HangUpCallButton = ({
  onPressHandler,
  onHangupCallHandler,
}: HangUpCallButtonProps) => {
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const {
    theme: { colors, hangupCallButton },
  } = useTheme();

  const onPress = async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    try {
      if (callingState === CallingState.LEFT) {
        return;
      }
      await call?.leave();
      if (onHangupCallHandler) {
        onHangupCallHandler();
      }
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  };

  return (
    <CallControlsButton
      onPress={onPress}
      color={colors.error}
      style={hangupCallButton}
      testID={ButtonTestIds.HANG_UP_CALL}
    >
      <PhoneDown color={colors.static_white} />
    </CallControlsButton>
  );
};

// TODO: Check if this style is needed
// This was passed to CallControlsButton as style prop
// const styles = StyleSheet.create({
//   button: {
//     shadowColor: theme.light.error,
//   },
// });
