import {
  CallContentProps,
  ScreenShareToggleButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCallStateHooks,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BOTTOM_CONTROLS_HEIGHT, Z_INDEX } from '../../constants';
import { MoreActionsButton } from './MoreActionsButton';
import { ParticipantsButton } from './ParticipantsButton';
import { ChatButton } from './ChatButton';
import { RecordCallButton } from './RecordCallButton';

export type BottomControlsProps = Pick<
  CallContentProps,
  'supportedReactions'
> & {
  onChatOpenHandler?: () => void;
  onParticipantInfoPress?: () => void;
  unreadCountIndicator?: number;
  toggleCallRecording: () => Promise<void>;
  isAwaitingResponse: boolean;
  isCallRecordingInProgress: boolean;
};

export const BottomControls = ({
  onChatOpenHandler,
  unreadCountIndicator,
  onParticipantInfoPress,
  toggleCallRecording,
  isAwaitingResponse,
  isCallRecordingInProgress,
}: BottomControlsProps) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isSpeakingWhileMuted } = useMicrophoneState();
  const styles = useStyles(isSpeakingWhileMuted);

  return (
    <View style={styles.container}>
      {isSpeakingWhileMuted && (
        <View style={styles.speakingLabelContainer}>
          <Text style={styles.label}>You are muted. Unmute to speak.</Text>
        </View>
      )}
      <View style={[styles.callControlsWrapper]}>
        <View style={styles.left}>
          <MoreActionsButton />
          <ToggleAudioPublishingButton />
          <ToggleVideoPublishingButton />
          <ScreenShareToggleButton />
          <RecordCallButton
            toggleCallRecording={toggleCallRecording}
            isAwaitingResponse={isAwaitingResponse}
            isCallRecordingInProgress={isCallRecordingInProgress}
          />
        </View>
        <View style={styles.right}>
          <ParticipantsButton onParticipantInfoPress={onParticipantInfoPress} />
          <ChatButton
            onPressHandler={onChatOpenHandler}
            unreadBadgeCount={unreadCountIndicator}
          />
        </View>
      </View>
    </View>
  );
};

const useStyles = (showMicLabel: boolean) => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingVertical: !showMicLabel ? theme.variants.spacingSizes.md : 0,
          paddingHorizontal: theme.variants.spacingSizes.md,
          backgroundColor: theme.colors.sheetPrimary,
          height: BOTTOM_CONTROLS_HEIGHT,
        },
        speakingLabelContainer: {
          backgroundColor: theme.colors.sheetPrimary,
          width: '100%',
        },
        label: {
          textAlign: 'center',
          color: theme.colors.textPrimary,
        },
        callControlsWrapper: {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          zIndex: Z_INDEX.IN_FRONT,
        },
        left: {
          flex: 2.5,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: theme.variants.spacingSizes.xs,
        },
        right: {
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: theme.variants.spacingSizes.xs,
        },
      }),
    [theme, showMicLabel],
  );
};
