import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@stream-io/video-react-native-sdk/src';
import { VideoEffectsButton } from '../VideoEffectsButton';
import { ToggleCameraFaceButton } from '@stream-io/video-react-native-sdk';
import { LayoutSwitcherButton } from './LayoutSwitcherButton';

export const TopLeftControls = (props: any) => {
  const styles = useStyles();
  return (
    <View style={styles.content}>
      <LayoutSwitcherButton onPressHandler={() => {}} />
      <ToggleCameraFaceButton />
      {!props.inProgress && <VideoEffectsButton />}
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        content: {
          flexDirection: 'row',
          // gap: 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [theme],
  );
};
