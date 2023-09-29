import {
  ChatButton,
  HangUpCallButton,
  ReactionButton,
  ToggleAudioPublishingButton,
  ToggleCameraFaceButton,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { appTheme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Z_INDEX } from '../constants';
import { useOrientation } from '../hooks/useOrientation';

export type CallControlsComponentProps = {
  onChatOpenHandler?: () => void;
  onHangupCallHandler?: () => void;
  unreadCountIndicator?: number;
};

export const CallControlsComponent = ({
  onChatOpenHandler,
  onHangupCallHandler,
  unreadCountIndicator,
}: CallControlsComponentProps) => {
  const { bottom } = useSafeAreaInsets();
  const orientation = useOrientation();
  const landScapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'column-reverse' : 'row',
    paddingHorizontal: orientation === 'landscape' ? 12 : 0,
    paddingVertical: orientation === 'portrait' ? 12 : 0,
    paddingBottom:
      orientation === 'portrait' ? Math.max(bottom, appTheme.spacing.lg) : 0,
  };

  return (
    <View style={[styles.callControlsWrapper, landScapeStyles]}>
      <ReactionButton />
      <ChatButton
        onPressHandler={onChatOpenHandler}
        unreadBadgeCount={unreadCountIndicator}
      />
      <ToggleVideoPublishingButton />
      <ToggleAudioPublishingButton />
      <ToggleCameraFaceButton />
      <HangUpCallButton onPressHandler={onHangupCallHandler} />
    </View>
  );
};

const styles = StyleSheet.create({
  callControlsWrapper: {
    justifyContent: 'space-evenly',
    zIndex: Z_INDEX.IN_FRONT,
    backgroundColor: appTheme.colors.static_grey,
  },
});
