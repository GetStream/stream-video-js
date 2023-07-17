import React from 'react';
import { StyleSheet, View } from 'react-native';
import LiveButtons from './LiveButtons';
import ToggleAudioButton from './ToggleAudioButton';

export const ControlsPanel = () => {
  return (
    <View style={styles.container}>
      <ToggleAudioButton />
      <LiveButtons />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
});
