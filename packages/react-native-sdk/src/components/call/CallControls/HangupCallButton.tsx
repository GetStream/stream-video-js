import React, { useCallback } from 'react';
import { CallControlsButton } from './CallControlsButton';
import { theme } from '../../../theme';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { PhoneDown } from '../../../icons';
import { ButtonTestIds } from '../../../constants/TestIds';
import { useCall, useCallCallingState } from '@stream-io/video-react-bindings';
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
   */
  onHangUpCall?: () => void;
  /**
   * Style of the Button Container
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Button to hangup a call.
 *
 * Mostly calls call.leave() internally.
 */
export const HangUpCallButton = ({
  onPressHandler,
  onHangUpCall,
  style,
}: HangUpCallButtonProps) => {
  const call = useCall();
  const callingState = useCallCallingState();

  const hangUpCallHandler = useCallback(async () => {
    if (onPressHandler) {
      onPressHandler();
      return;
    }
    try {
      if (callingState === CallingState.LEFT) {
        return;
      }
      await call?.leave();
      if (onHangUpCall) {
        onHangUpCall();
      }
    } catch (error) {
      console.error('Error leaving call:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  return (
    <CallControlsButton
      onPress={hangUpCallHandler}
      color={theme.light.error}
      style={[styles.button, { shadowColor: theme.light.error }, style]}
      testID={ButtonTestIds.HANG_UP_CALL}
    >
      <PhoneDown color={theme.light.static_white} />
    </CallControlsButton>
  );
};

const styles = StyleSheet.create({
  button: {
    // For iOS
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,

    // For android
    elevation: 6,
  },
});
