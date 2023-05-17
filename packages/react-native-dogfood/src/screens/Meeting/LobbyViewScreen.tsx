import { LobbyView, theme } from '@stream-io/video-react-native-sdk';
import React from 'react';
import { Text } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppGlobalStoreSetState } from '../../contexts/AppContext';

export const LobbyViewScreen = () => {
  const appStoreSetState = useAppGlobalStoreSetState();

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]}>
      <LobbyView />
      <Pressable
        style={styles.anonymousButton}
        onPress={() => {
          appStoreSetState({ appMode: 'Guest' });
        }}
      >
        <Text style={styles.anonymousButtonText}>
          Join as Guest or Anonymously
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
  anonymousButton: {
    alignItems: 'center',
    marginBottom: theme.margin.md,
  },
  anonymousButtonText: {
    ...theme.fonts.heading6,
    color: theme.light.primary,
  },
});
