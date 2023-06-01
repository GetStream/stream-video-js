import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
});

export const AuthenticationProgress = () => (
  <SafeAreaView style={styles.container}>
    <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
  </SafeAreaView>
);
