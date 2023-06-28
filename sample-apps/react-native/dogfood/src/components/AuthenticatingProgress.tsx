import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { appTheme } from '../theme';

export const AuthenticationProgress = () => (
  <SafeAreaView style={styles.container}>
    <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
});
