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

export const TopLeftControls = () => {
  const styles = useStyles();
  return (
    <View style={styles.content}>
      <ToggleViewButton onPressHandler={() => {}} />
      <FlipCameraButton onPressHandler={() => {}} />
      <VideoEffectsButton onPressHandler={() => {}} />
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        content: {
          // display: 'flex',
          flexDirection: 'row',
          // padding: 5,
          gap: 6,
          // width: 200,
          // borderWidth: 2,
          // borderColor: 'red',
        },
        // backIconContainer: {
        //   // Added to compensate the participant badge surface area
        //   marginLeft: 8,
        // },
        // leftElement: {
        //   flex: 1,
        //   alignItems: 'flex-start',
        // },
        // centerElement: {
        //   flex: 1,
        //   alignItems: 'center',
        //   flexGrow: 3,
        // },
        // rightElement: {
        //   flex: 1,
        //   alignItems: 'flex-end',
        // },
        // centerWrapper: {
        //   backgroundColor: colors.buttonSecondaryDefault,
        //   borderRadius: 8,
        //   width: 60,
        //   display: 'flex',
        //   flexDirection: 'row',
        //   height: 32,
        //   padding: 6,
        //   justifyContent: 'center',
        //   alignItems: 'center',
        //   // gap: 4,
        // },
        // timer: {
        //   color: colors.typePrimary,
        //   fontSize: 13,
        //   fontWeight: '600',
        // },
      }),
    [theme]
  );
};
