import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ToggleAudioPreviewButton } from './ToggleAudioPreviewButton';
import { ToggleVideoPreviewButton } from './ToggleVideoPreviewButton';
import { useTheme } from '../../../contexts/ThemeContext';

/**
 * Controls for the Lobby Component
 */
export const LobbyControls = () => {
  const {
    theme: { lobbyControls },
  } = useTheme();
  return (
    <View style={[styles.container, lobbyControls.container]}>
      <ToggleAudioPreviewButton />
      <ToggleVideoPreviewButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});
