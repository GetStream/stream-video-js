import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import {
  CallControlsButton,
  callManager,
  ToggleCameraFaceButton,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { AndroidAudioRoutePickerDrawer } from '../../components/CallControlls/MoreActionsButton/AndroidAudioRoutePickerDrawer';
import { AudioOutput } from '../../assets/AudioOutput';

export const SourcePickers = ({ disabled = false }: { disabled?: boolean }) => {
  const {
    theme: { colors, chatButton, defaults },
  } = useTheme();
  const [isAudioRouteDrawerVisible, setIsAudioRouteDrawerVisible] =
    useState(false);

  const showAudioRoutePicker = () => {
    if (disabled) {
      return;
    }

    if (Platform.OS === 'ios') {
      callManager.ios.showDeviceSelector();
    } else {
      setIsAudioRouteDrawerVisible(true);
    }
  };

  return (
    <>
      <View
        pointerEvents={disabled ? 'none' : 'auto'}
        style={disabled ? { opacity: 0.5 } : undefined}
      >
        <ToggleCameraFaceButton />
      </View>
      <View style={disabled ? { opacity: 0.5 } : undefined}>
        <CallControlsButton
          disabled={disabled}
          onPress={showAudioRoutePicker}
          style={chatButton}
        >
          <IconWrapper>
            <AudioOutput color={colors.iconPrimary} size={defaults.iconSize} />
          </IconWrapper>
        </CallControlsButton>
      </View>
      {Platform.OS === 'android' ? (
        <AndroidAudioRoutePickerDrawer
          isVisible={isAudioRouteDrawerVisible}
          onClose={() => setIsAudioRouteDrawerVisible(false)}
          bottomControlsHeight={0}
        />
      ) : null}
    </>
  );
};
