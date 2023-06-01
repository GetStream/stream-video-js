import React from 'react';
import {ActiveCall, useCall} from '@stream-io/video-react-native-sdk';
import {ActivityIndicator, SafeAreaView, StyleSheet} from 'react-native';
import {theme} from '@stream-io/video-react-native-sdk/src/theme';

export function ActiveCallScreen() {
  const activeCall = useCall();

  if (!activeCall) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }
  return (
    <SafeAreaView style={styles.wrapper}>
      <ActiveCall />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
});
