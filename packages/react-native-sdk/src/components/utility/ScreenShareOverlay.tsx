import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StopScreenShare } from '../../icons';
import { useTheme } from '../../contexts';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { SfuModels } from '@stream-io/video-client';

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
    theme: {
      colors,
      typefaces,
      variants: { iconSizes },
      screenshareOverlay,
    },
  } = useTheme();

  const onStopScreenshareHandler = async () => {
    await call?.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.sheetTertiary },
        screenshareOverlay.container,
      ]}
    >
      <Text
        style={[
          styles.text,
          typefaces.subtitleBold,
          { color: colors.textPrimary },
          screenshareOverlay.text,
        ]}
      >
        {t('You are sharing your screen with everyone')}
      </Text>
      <Pressable
        onPress={onStopScreenshareHandler}
        style={({ pressed }) => {
          return [
            styles.button,
            {
              backgroundColor: colors.sheetSecondary,
              opacity: pressed ? 0.2 : 1,
            },
            screenshareOverlay.button,
          ];
        }}
      >
        <View
          style={[
            styles.buttonIcon,
            { height: iconSizes.xs, width: iconSizes.xs },
            screenshareOverlay.buttonIcon,
          ]}
        >
          <StopScreenShare size={iconSizes.xs} color={colors.iconPrimary} />
        </View>
        <Text
          style={[
            styles.buttonText,
            { color: colors.textPrimary },
            screenshareOverlay.buttonText,
          ]}
        >
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
  text: {},
  button: {
    marginTop: 16,
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
