import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Grid } from '../../../icons/Grid';
import { FlipCameraButton, VideoEffectsButton, useTheme } from '../../..';
import { ToggleViewButton } from '../CallControls/ToggleViewButton';

export const TopLeftControls = (props: any) => {
  const styles = useStyles();
  return (
    <View style={styles.content}>
      <ToggleViewButton onPressHandler={() => {}} />
      <FlipCameraButton onPressHandler={() => {}} />
      {!props.inProgress && <VideoEffectsButton onPressHandler={() => {}} />}
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
          gap: 6,
        },
      }),
    [theme]
  );
};
