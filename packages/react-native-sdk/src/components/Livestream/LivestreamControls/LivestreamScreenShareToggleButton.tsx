import React from 'react';
import { useTheme } from '../../../contexts';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { ScreenShare } from '../../../icons';
import useScreenShareToggle from '../../../hooks/useScreenShareToggle';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';

/**
 * The LivestreamVideoControlButton controls the screenshare stream publish/unpublish while in the livestream for the host.
 */
export const LivestreamScreenShareToggleButton = () => {
  const {
    onPress,
    isScreenSharingEnabledInCall,
    screenCapturePickerViewiOSRef,
  } = useScreenShareToggle();
  const {
    theme: {
      colors,
      variants: { iconSizes, buttonSizes },
      livestreamScreenShareToggleButton,
    },
  } = useTheme();

  if (!isScreenSharingEnabledInCall) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.dark_gray,
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
        <ScreenShare color={colors.static_white} />
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
