import {
  ScreenShareToggleButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { MoreActionsButton } from '../MoreActionsButton';
import { ParticipantsButton } from './ParticipantsButton';
import { ChatButton } from './ChatButton';
import { RecordCallButton } from './RecordCallButton';
import { SubtitleContainer } from './SubtitleContainer';
import { useFoldAwareBarLayout } from '../../../contexts/FoldAwareBarLayoutContext';
import { Z_INDEX } from '../../../constants';

export const BottomControls = () => {
  const styles = useStyles();
  const {
    theme: { callControls },
  } = useTheme();
  const [measuredHeight, setMeasuredHeight] = useState<number>();
  // drawers and subtitles are lifted above the controls only when the
  // controls are below the video; beside the video there is nothing to clear
  const controlsContainerHeight = measuredHeight;

  const onLayout = (event: LayoutChangeEvent) => {
    setMeasuredHeight(event.nativeEvent.layout.height);
  };

  const barLayout = useFoldAwareBarLayout();
  useEffect(() => {
    barLayout?.setBottomBarHeight(controlsContainerHeight ?? 0);
  }, [barLayout, controlsContainerHeight]);

  const buttons = (
    <>
      <View style={[styles.left]}>
        <MoreActionsButton controlsContainerHeight={controlsContainerHeight} />
        <ToggleAudioPublishingButton />
        <ToggleVideoPublishingButton />
      </View>
      <View style={[styles.right]}>
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
      <View
        style={[styles.container, callControls.container]}
        onLayout={onLayout}
      >
        {buttons}
      </View>
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
