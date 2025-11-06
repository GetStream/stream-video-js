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
  const styles = useStyles();

  return (
    <>
      <View style={styles.container}>
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
            <ParticipantsButton
              onParticipantInfoPress={onParticipantInfoPress}
            />
            <ChatButton
              onPressHandler={onChatOpenHandler}
              unreadBadgeCount={unreadCountIndicator}
            />
          </View>
        </View>
      </View>
      {/* {isSpeakingWhileMuted && ( */}
      <View style={styles.speakingLabelContainer}>
        <Text style={styles.label}>You are muted. Unmute to speak.</Text>
      </View>
      {/* )} */}
    </>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingVertical: theme.variants.spacingSizes.md,
          backgroundColor: 'pink',
          height: BOTTOM_CONTROLS_HEIGHT,
        },
        speakingLabelContainer: {
          backgroundColor: theme.colors.sheetPrimary,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: BOTTOM_CONTROLS_HEIGHT,
        },
        label: {
          textAlign: 'center',
          color: theme.colors.textPrimary,
        },
        callControlsWrapper: {
          paddingHorizontal: theme.variants.spacingSizes.md,
          flexDirection: 'row',
          justifyContent: 'flex-start',
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
    [theme],
  );
};
