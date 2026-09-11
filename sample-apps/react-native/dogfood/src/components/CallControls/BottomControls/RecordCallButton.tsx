import React, { useState } from 'react';
import {
  CallControlsButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { RecordCall } from '../../../assets/RecordCall';
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
    theme: { components, semantics },
  } = useTheme();

  const [isStopRecordingModalOpen, setIsStopRecordingModalOpen] =
    useState(false);

  const buttonColor = isCallRecordingInProgress
    ? semantics.accentWarning
    : semantics.accentPrimary;

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

  return (
    <CallControlsButton
      onPress={onPress}
      color={buttonColor}
      disabled={isAwaitingResponse}
    >
      {endRecording}
      <IconWrapper>
        <RecordCall
          color={semantics.accentPrimary}
          size={components.iconSizeSm}
        />
      </IconWrapper>
    </CallControlsButton>
  );
};
