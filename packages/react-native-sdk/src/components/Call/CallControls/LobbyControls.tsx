import React, { useMemo } from 'react';
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
  const styles = useStyles();
  return (
    <View style={[styles.container, lobbyControls.container]}>
      <ToggleAudioPreviewButton />
      <ToggleVideoPreviewButton />
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingTop: theme.variants.spacingSizes.xs,
          flexDirection: 'row',
          justifyContent: 'space-evenly',
        },
      }),
    [theme],
  );
};
