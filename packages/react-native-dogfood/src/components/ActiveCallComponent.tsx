import React from 'react';
import {
  ActiveCall,
  theme,
  useAndroidForegroundCallEffect,
  useCall,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';

export const ActiveCallComponent = () => {
  const call = useCall();

  useAndroidForegroundCallEffect();

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
    backgroundColor: theme.light.static_grey,
  },
});
