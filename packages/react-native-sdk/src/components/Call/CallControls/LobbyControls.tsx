import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ToggleAudioPreviewButton } from './Buttons/ToggleAudioPreviewButton';
import { ToggleVideoPreviewButton } from './Buttons/ToggleVideoPreviewButton';
import { useTheme } from '../../../contexts/ThemeContext';

export type LobbyControlsProps = {
  landscape?: boolean;
};

/**
 * Controls for the Lobby Component
 */
export const LobbyControls = ({}: LobbyControlsProps) => {
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
