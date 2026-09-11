import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StopScreenShare } from '../../icons';
import { useTheme } from '../../contexts';
import { useCall, useI18n } from '@stream-io/video-react-bindings';

/**
 * Props for the ScreenShareOverlay component
 */
export type ScreenShareOverlayProps = {};

/**
 * The component that displays the screen sharing overlay, when the screen is shared.
 */
export const ScreenShareOverlay = ({}: ScreenShareOverlayProps) => {
  const call = useCall();
  const { t } = useI18n();
  const {
    theme: { screenshareOverlay, components, semantics },
  } = useTheme();

  const onStopScreenshareHandler = async () => {
    // force-stop is required to stop the OS prompts of screen share
    await call?.screenShare.disable(true);
  };

  return (
    <View style={[styles.container, screenshareOverlay.container]}>
      <Text style={screenshareOverlay.text}>
        {t('You are sharing your screen with everyone')}
      </Text>
      <Pressable
        onPress={onStopScreenshareHandler}
        style={({ pressed }) => {
          return [
            styles.button,
            screenshareOverlay.button,
            {
              opacity: pressed ? 0.2 : 1,
            },
          ];
        }}
      >
        <View style={screenshareOverlay.buttonIcon}>
          <StopScreenShare
            size={components.iconSizeMd}
            color={semantics.accentNeutral}
          />
        </View>
        <Text style={screenshareOverlay.buttonText}>
          {t('Stop Screen Sharing')}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
