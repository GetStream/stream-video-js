import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ToggleAudioPreviewButton } from './ToggleAudioPreviewButton';
import { ToggleVideoPreviewButton } from './ToggleVideoPreviewButton';
import { theme } from '../../../theme';

/**
 * Controls for the Lobby Component
 */
export const LobbyControls = () => {
  return (
    <View style={styles.container}>
      <ToggleAudioPreviewButton />
      <ToggleVideoPreviewButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.padding.md,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
