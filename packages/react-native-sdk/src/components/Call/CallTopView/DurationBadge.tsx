import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CallDuration } from '../../../icons';
import { useTheme } from '../../..';

// TODO: move to dogfood app
export const DurationBadge = () => {
  const {
    theme: {
      colors,
      typefaces,
      variants: { iconSizes },
      callTopView,
    },
  } = useTheme();
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);
  const styles = useStyles();

  // Format duration to MM:SS
  const minutes = Math.floor(duration / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (duration % 60).toString().padStart(2, '0');
  const timestamp = `${minutes}:${seconds}`;

  return (
    <View style={styles.centerWrapper}>
      <CallDuration color={colors.iconAlertSuccess} size={iconSizes.md} />
      <Text style={styles.timer}>{timestamp}</Text>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        content: {
          position: 'absolute',
          top: 0,
          flexDirection: 'row',
          paddingTop: 24,
          paddingBottom: 12,
          alignItems: 'center',
        },
        backIconContainer: {
          // Added to compensate the participant badge surface area
          marginLeft: 8,
        },
        leftElement: {
          flex: 1,
          alignItems: 'flex-start',
        },
        centerElement: {
          flex: 1,
          alignItems: 'center',
          flexGrow: 3,
        },
        rightElement: {
          flex: 1,
          alignItems: 'flex-end',
        },
        centerWrapper: {
          backgroundColor: theme.colors.buttonSecondaryDefault,
          borderRadius: 8,
          width: 90,
          display: 'flex',
          flexDirection: 'row',
          height: 32,
          padding: 6,
          justifyContent: 'center',
          alignItems: 'center',
          // gap: 4,
        },
        timer: {
          color: theme.colors.typePrimary,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [theme]
  );
};
