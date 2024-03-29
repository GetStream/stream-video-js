import React from 'react';
import { useTheme } from '../../../contexts';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { ScreenShare } from '../../../icons';
import useScreenShare from '../../../hooks/useScreenShare';
import { ScreenCapturePickerView } from '@stream-io/react-native-webrtc';

/**
 * The LivestreamVideoControlButton controls the screenshare stream publish/unpublish while in the livestream for the host.
 */
export const LivestreamScreenShareButton = () => {
  const {
    onPress,
    isScreenSharingEnabledInCall,
    screenCapturePickerViewiOSRef,
  } = useScreenShare();
  const {
    theme: {
      colors,
      variants: { iconSizes, buttonSizes },
      livestreamScreenShareButton,
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
        livestreamScreenShareButton.container,
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            height: iconSizes.sm,
            width: iconSizes.sm,
          },
          livestreamScreenShareButton.icon,
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
