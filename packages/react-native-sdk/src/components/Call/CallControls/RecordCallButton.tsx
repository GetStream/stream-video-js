import React, { useState } from 'react';
import { CallControlsButton } from './CallControlsButton';
import { useTheme } from '../../../contexts/ThemeContext';
import { RecordCall } from '../../../icons/RecordCall';
import { IconWrapper } from '../../../icons';

/**
 * The props for the Record Call Button in the Call Controls.
 */
export type RecordCallButtonProps = {
  /**
   * Handler to be called when the record call button is pressed.
   * @returns void
   */
  onPressHandler?: () => void;
};

/**
 * The Record Call Button is used in the Call Controls component
 * and allows the user to toggle call recording.
 */
export const RecordCallButton = ({ onPressHandler }: RecordCallButtonProps) => {
  const {
    theme: { colors, recordCallButton, defaults, variants },
  } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const buttonColor = isRecording
    ? colors.buttonSecondaryWarningDefault
    : colors.buttonSecondaryDefault;

  // TODO: implement PBE-5871 [Demo App] Call Recording flow
  return (
    <CallControlsButton
      size={variants.roundButtonSizes.lg}
      onPress={() => {
        if (onPressHandler) onPressHandler();
        setIsRecording(!isRecording);
      }}
      color={buttonColor}
      style={recordCallButton}
    >
      <IconWrapper>
        <RecordCall
          color={colors.iconPrimaryDefault}
          size={defaults.iconSize}
        />
      </IconWrapper>
    </CallControlsButton>
  );
};
