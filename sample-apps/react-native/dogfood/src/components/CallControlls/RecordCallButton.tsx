import React, { useState } from 'react';
import {
  CallControlsButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { RecordCall } from '@stream-io/video-react-native-sdk/src/icons/RecordCall';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { CallRecordingModal } from './CallRecordingModal';

/**
 * The props for the Record Call Button in the Call Controls.
 */
export type RecordCallButtonProps = {
  onPressHandler?: () => void;
  toggleCallRecording: () => Promise<void>;
  isAwaitingResponse: boolean;
  isCallRecordingInProgress: boolean;
};

/**
 * The Record Call Button is used in the Call Controls component
 * and allows the user to toggle call recording.
 */
export const RecordCallButton = ({
  onPressHandler,
  toggleCallRecording,
  isAwaitingResponse,
  isCallRecordingInProgress,
}: RecordCallButtonProps) => {
  const {
    theme: { colors, recordCallButton, variants },
  } = useTheme();

  const [isStopRecordingModalOpen, setIsStopRecordingModalOpen] =
    useState(false);

  const buttonColor = isCallRecordingInProgress
    ? colors.buttonSecondaryWarningDefault
    : colors.buttonSecondaryDefault;

  const onPress = async () => {
    if (onPressHandler) {
      onPressHandler();
    }
    if (isCallRecordingInProgress) {
      setIsStopRecordingModalOpen(true);
    } else {
      await toggleCallRecording();
    }
  };

  const endRecording = (
    <CallRecordingModal
      visible={isStopRecordingModalOpen}
      isLoading={isAwaitingResponse}
      title="End Recording"
      confirmButton="End recording"
      cancelButton="Cancel"
      isEndRecordingModal={true}
      message="Are you sure you want to end recording?"
      onCancel={() => {
        if (!isAwaitingResponse) {
          setIsStopRecordingModalOpen(false);
        }
      }}
      onConfirm={async () => {
        if (!isAwaitingResponse) {
          await toggleCallRecording();
          setIsStopRecordingModalOpen(false);
        }
      }}
    />
  );

  // TODO: add consent modal recording for other users in the call
  // const consentRecording = (
  //   <CallRecordingModal
  //     visible={isConsentRecordingModalOpen}
  //     isLoading={isAwaitingResponse}
  //     title="This call is being recorded"
  //     confirmButton="Continue"
  //     cancelButton="Leave call"
  //     isEndRecordingModal={false}
  //     message="By staying in the call you're consenting to being recorded."
  //     onCancel={onHangupCallHandler}
  //     onConfirm={() => setIsConsentRecordingModalOpen(false)}
  //   />
  // );

  return (
    <CallControlsButton
      size={variants.roundButtonSizes.lg}
      onPress={onPress}
      color={buttonColor}
      style={recordCallButton}
      disabled={isAwaitingResponse}
      disabledColor={colors.buttonPrimaryDisabled}
    >
      {endRecording}
      <IconWrapper>
        <RecordCall
          color={colors.iconPrimaryDefault}
          size={variants.roundButtonSizes.sm}
        />
      </IconWrapper>
    </CallControlsButton>
  );
};
