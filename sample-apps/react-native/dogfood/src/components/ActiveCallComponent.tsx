import React from 'react';
import { ActiveCall, useCall } from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { appTheme } from '../theme';

export const ActiveCallComponent = () => {
  const call = useCall();

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return (
    <SafeAreaView style={styles.wrapper}>
      <ActiveCall />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
});
