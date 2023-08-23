import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '../../../theme';

export const JoiningCallIndicator = () => (
  <SafeAreaView style={styles.container}>
    <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
});
