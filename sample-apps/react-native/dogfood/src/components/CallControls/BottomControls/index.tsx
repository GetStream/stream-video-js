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
import { Z_INDEX } from '../../../constants';

export type BottomControlsProps = Pick<
  CallContentProps,
  'supportedReactions'
> & {
  landscape?: boolean;
};

export const BottomControls = ({ landscape = false }: BottomControlsProps) => {
  const styles = useStyles();
  const {
    theme: { callControls },
  } = useTheme();
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
      </View>
      <View style={[styles.right, landscape && styles.groupLandscape]}>
        <ScreenShareToggleButton
          screenShareOptions={{ type: 'broadcast', includeAudio: true }}
        />
        <RecordCallButton />
        <ParticipantsButton />
        <ChatButton />
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
        <View
          style={[styles.container, callControls.container]}
          onLayout={onLayout}
        >
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
  const {
    theme: { primitives },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          zIndex: Z_INDEX.IN_FRONT,
        },
        left: {
          flexDirection: 'row',
        },
        right: {
          flexDirection: 'row',
        },
        containerLandscape: {
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingTop: primitives.spacingSm,
          paddingBottom: primitives.spacingSm,
          // matches the top controls' horizontal padding so hang-up lines up
          paddingHorizontal: primitives.spacingMd,
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
    [primitives],
  );
};
