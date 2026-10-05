import {
  CallContentProps,
  ScreenShareToggleButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import { MoreActionsButton } from '../MoreActionsButton';
import { ParticipantsButton } from './ParticipantsButton';
import { ChatButton } from './ChatButton';
import { RecordCallButton } from './RecordCallButton';
import { SubtitleContainer } from './SubtitleContainer';
import { useFoldAwareBarLayout } from '../../../contexts/FoldAwareBarLayoutContext';

export type BottomControlsProps = Pick<
  CallContentProps,
  'supportedReactions'
> & {
  /**
   * Stacks the controls vertically for the landscape layout,
   * where they sit beside the video instead of below it.
   */
  landscape?: boolean;
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
  landscape,
}: BottomControlsProps) => {
  const styles = useStyles();
  const [measuredHeight, setMeasuredHeight] = useState<number>();
  // drawers and subtitles are lifted above the controls only when the
  // controls are below the video; beside the video there is nothing to clear
  const controlsContainerHeight =
    measuredHeight === undefined ? undefined : landscape ? 0 : measuredHeight;

  const onLayout = (event: LayoutChangeEvent) => {
    setMeasuredHeight(event.nativeEvent.layout.height);
  };

  const barLayout = useFoldAwareBarLayout();
  useEffect(() => {
    barLayout?.setBottomBarHeight(controlsContainerHeight ?? 0);
  }, [barLayout, controlsContainerHeight]);

  const buttons = (
    <>
      <View style={[styles.left, landscape && styles.groupLandscape]}>
        <MoreActionsButton controlsContainerHeight={controlsContainerHeight} />
        <ToggleAudioPublishingButton />
        <ToggleVideoPublishingButton />
        <ScreenShareToggleButton
          screenShareOptions={{ type: 'broadcast', includeAudio: true }}
        />
        <RecordCallButton
          toggleCallRecording={toggleCallRecording}
          isAwaitingResponse={isAwaitingResponse}
          isCallRecordingInProgress={isCallRecordingInProgress}
        />
      </View>
      <View style={[styles.right, landscape && styles.groupLandscape]}>
        <ParticipantsButton onParticipantInfoPress={onParticipantInfoPress} />
        {onChatOpenHandler && <ChatButton onPressHandler={onChatOpenHandler} />}
      </View>
    </>
  );

  return (
    <>
      {landscape ? (
        // a short window cannot fit the whole column, so let it scroll
        <ScrollView
          style={styles.landscapeScroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
          onLayout={onLayout}
          contentContainerStyle={[
            styles.containerLandscape,
            styles.landscapeContent,
          ]}
        >
          {buttons}
        </ScrollView>
      ) : (
        <View style={styles.container} onLayout={onLayout}>
          {buttons}
        </View>
      )}
      {controlsContainerHeight !== undefined && (
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
        containerLandscape: {
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingTop: theme.variants.spacingSizes.sm,
          paddingBottom: theme.variants.spacingSizes.sm,
          // matches the top controls' horizontal padding so hang-up lines up
          paddingHorizontal: theme.variants.spacingSizes.md,
        },
        // a ScrollView grows by default and would take width from the video
        landscapeScroll: {
          flexGrow: 0,
          flexShrink: 0,
        },
        landscapeContent: {
          flexGrow: 1,
        },
        groupLandscape: {
          flex: 0,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
        },
      }),
    [theme],
  );
};
