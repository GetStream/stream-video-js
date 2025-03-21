import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { ScreenShare } from '../../../icons/ScreenShare';
import { StopScreenShare } from '../../../icons/StopScreenShare';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';
import { useScreenShareButton } from '../../../hooks/useScreenShareButton';

export type LivestreamScreenShareToggleButtonProps = {};

/**
 * The LivestreamVideoControlButton controls the screenshare stream publish/unpublish while in the livestream for the host.
 */
export const LivestreamScreenShareToggleButton = () => {
  const {
    theme: {
      colors,
      variants: { iconSizes, buttonSizes },
      livestreamScreenShareToggleButton,
    },
  } = useTheme();

  const screenCapturePickerViewiOSRef = React.useRef(null);

  const { onPress, hasPublishedScreenShare } = useScreenShareButton(
    screenCapturePickerViewiOSRef,
  );

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: hasPublishedScreenShare
            ? colors.buttonWarning
            : colors.buttonSecondary,
          height: buttonSizes.xs,
          width: buttonSizes.xs,
        },
        livestreamScreenShareToggleButton.container,
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            height: iconSizes.sm,
            width: iconSizes.sm,
          },
          livestreamScreenShareToggleButton.icon,
        ]}
      >
        {hasPublishedScreenShare ? (
          <StopScreenShare size={iconSizes.sm} color={colors.iconPrimary} />
        ) : (
          <ScreenShare size={iconSizes.sm} color={colors.iconPrimary} />
        )}
      </View>
      {Platform.OS === 'ios' && (
        <ScreenCapturePickerView ref={screenCapturePickerViewiOSRef} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  icon: {},
});
