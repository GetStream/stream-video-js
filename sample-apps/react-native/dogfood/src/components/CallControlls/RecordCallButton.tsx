import React, { useState } from 'react';
import {
  CallControlsButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { RecordCall } from '@stream-io/video-react-native-sdk/src/icons/RecordCall';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { EndRecordingModal } from './EndRecordingModal';

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
    theme: { colors, recordCallButton, variants },
  } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const buttonColor = isRecording
    ? colors.buttonSecondaryWarningDefault
    : colors.buttonSecondaryDefault;

  // TODO: implement PBE-5871 [Demo App] Call Recording flow
  return (
    <CallControlsButton
      size={variants.roundButtonSizes.lg}
      onPress={() => {
        if (onPressHandler) {
          onPressHandler();
        }
        setIsRecording(!isRecording);
        setIsVisible(!isVisible);
      }}
      color={buttonColor}
      style={recordCallButton}
    >
      <EndRecordingModal
        visible={isVisible}
        onCancel={() => {
          setIsVisible(false);
        }}
        onConfirm={() => {
          setIsVisible(false);
        }}
      />
      <IconWrapper>
        <RecordCall
          color={colors.iconPrimaryDefault}
          size={variants.roundButtonSizes.sm}
        />
      </IconWrapper>
    </CallControlsButton>
  );
};
