import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../contexts';

/**
 * Props for the ScreenShareOverlay component
 */
export type ScreenShareOverlayProps = {};

/**
 * The component that displays the screen sharing overlay, when the screen is shared.
 */
export const ScreenShareOverlay = () => {
  const {
    theme: { colors, typefaces, screenshareOverlay },
  } = useTheme();

  return (
    <View style={[styles.container, screenshareOverlay.container]}>
      <Text
        style={[
          styles.text,
          typefaces.subtitleBold,
          { color: colors.static_white },
          screenshareOverlay.text,
        ]}
      >
        You are sharing your screen with everyone
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {},
  button: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {},
  buttonText: {
    marginLeft: 8,
    includeFontPadding: false,
  },
});
