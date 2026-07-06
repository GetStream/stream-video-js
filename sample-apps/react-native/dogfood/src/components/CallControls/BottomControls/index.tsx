import {
  CallContentProps,
  ScreenShareToggleButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { MoreActionsButton } from '../MoreActionsButton';
import { ParticipantsButton } from './ParticipantsButton';
import { ChatButton } from './ChatButton';
import { RecordCallButton } from './RecordCallButton';
import { SubtitleContainer } from './SubtitleContainer';

export type BottomControlsProps = Pick<
  CallContentProps,
  'supportedReactions'
> & {
  onChatOpenHandler: (() => void) | null;
  onParticipantInfoPress: () => void;
  toggleCallRecording: () => Promise<void>;
  isAwaitingResponse: boolean;
  isCallRecordingInProgress: boolean;
};

export const BottomControls = ({
  onChatOpenHandler,
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
          <ScreenShareToggleButton
            screenShareOptions={{ type: 'inApp', includeAudio: true }}
          />
          <RecordCallButton
            toggleCallRecording={toggleCallRecording}
            isAwaitingResponse={isAwaitingResponse}
            isCallRecordingInProgress={isCallRecordingInProgress}
          />
        </View>
        <View style={styles.right}>
          <ParticipantsButton onParticipantInfoPress={onParticipantInfoPress} />
          {onChatOpenHandler && (
            <ChatButton onPressHandler={onChatOpenHandler} />
          )}
        </View>
      </View>
      {!!controlsContainerHeight && (
        <SubtitleContainer controlsContainerHeight={controlsContainerHeight} />
      )}
    </>
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
