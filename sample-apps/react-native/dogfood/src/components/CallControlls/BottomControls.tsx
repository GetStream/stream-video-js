import {
  CallContentProps,
  ScreenShareToggleButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  getCallStateHooks,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { MoreActionsButton } from './MoreActionsButton';
import { ParticipantsButton } from './ParticipantsButton';
import { ChatButton } from './ChatButton';
import { RecordCallButton } from './RecordCallButton';
import { ClosedCaptions } from './ClosedCaptions';

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
  const styles = useStyles();
  const [controlsContainerHeight, setControlsContainerHeight] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    setControlsContainerHeight(event.nativeEvent.layout.height);
  };

  return (
    <>
      <View style={styles.container} onLayout={onLayout}>
        <View style={styles.left}>
          <MoreActionsButton
            controlsContainerHeight={controlsContainerHeight}
          />
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
      {!!controlsContainerHeight && (
        <SubtitleContainer controlsContainerHeight={controlsContainerHeight} />
      )}
    </>
  );
};

const { useIsCallCaptioningInProgress, useMicrophoneState } =
  getCallStateHooks();
// speaking while muted and caption controls - aka subtitle on top of video
const SubtitleContainer = ({
  controlsContainerHeight,
}: {
  controlsContainerHeight: number;
}) => {
  const styles = useStyles();
  const isCaptioningInProgress = useIsCallCaptioningInProgress();
  const { isSpeakingWhileMuted } = useMicrophoneState();
  if (!isCaptioningInProgress || !isSpeakingWhileMuted) {
    return null;
  }
  return (
    <View
      style={[styles.subtitleContainer, { bottom: controlsContainerHeight }]}
    >
      <ClosedCaptions />
      <View style={styles.speakingLabelContainer}>
        <Text style={styles.label}>{'You are muted. Unmute to speak.'}</Text>
      </View>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingTop: theme.variants.spacingSizes.sm,
          paddingBottom: theme.variants.spacingSizes.md,
          paddingHorizontal: theme.variants.spacingSizes.md,
          flexDirection: 'row',
          justifyContent: 'flex-start',
        },
        subtitleContainer: {
          position: 'absolute',
          left: 0,
          right: 0,
        },
        speakingLabelContainer: {
          backgroundColor: theme.colors.sheetPrimary,
        },
        label: {
          textAlign: 'center',
          color: theme.colors.textPrimary,
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
