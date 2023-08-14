import React, { useCallback } from 'react';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../../../theme';
import { StyleSheet } from 'react-native';
import { PhoneDown } from '../../../icons';
import { ButtonTestIds } from '../../../constants/TestIds';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';

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

  const onPress = useCallback(async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  return (
    <CallControlsButton
      onPress={onPress}
      color={theme.light.error}
      style={styles.button}
      testID={ButtonTestIds.HANG_UP_CALL}
    >
      <PhoneDown color={theme.light.static_white} />
    </CallControlsButton>
  );
};

const styles = StyleSheet.create({
  button: {
    shadowColor: theme.light.error,
  },
});
