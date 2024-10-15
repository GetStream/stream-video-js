import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CallDuration } from '../../../icons';
import { useTheme } from '../../..';

// TODO: move to dogfood app
export const DurationBadge = () => {
  const {
    theme: {
      colors,
      variants: { iconSizes },
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
    <View style={styles.container}>
      <View style={styles.icon}>
        <CallDuration color={colors.iconAlertSuccess} size={iconSizes.md} />
      </View>
      <Text style={styles.timer}>{timestamp}</Text>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: theme.colors.buttonSecondaryDefault,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'row',
          height: 32,
          paddingLeft: 20,
          paddingRight: 20,
          justifyContent: 'center',
          alignItems: 'center',
        },
        icon: {
          marginTop: 3,
        },
        timer: {
          color: theme.colors.typePrimary,
          fontSize: 13,
          fontWeight: '600',
          width: 40,
        },
      }),
    [theme]
  );
};
