import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
});

const AuthenticatingProgressScreen = () => (
  <SafeAreaView style={styles.container}>
    <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />
  </SafeAreaView>
);

export default AuthenticatingProgressScreen;
