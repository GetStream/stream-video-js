import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '@stream-io/video-react-native-sdk';

export const AuthenticationProgress = () => {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.sheetPrimary,
        },
      }),
    [theme],
  );
};
