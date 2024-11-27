import React, { useMemo } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '@stream-io/video-react-native-sdk';

export const AuthenticationProgress = () => {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
    </SafeAreaView>
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
