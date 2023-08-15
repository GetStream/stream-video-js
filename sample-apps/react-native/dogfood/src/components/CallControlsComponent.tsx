import {
  ChatButton,
  ChatButtonProps,
  HangUpCallButton,
  ReactionButton,
  ToggleAudioPublishingButton,
  ToggleCameraFaceButton,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { appTheme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Z_INDEX } from '../constants';

export type CallControlsComponentProps = {
  chatButton?: ChatButtonProps;
  onHangupCallHandler?: () => void;
};

export const CallControlsComponent = ({
  chatButton,
  onHangupCallHandler,
}: CallControlsComponentProps) => {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.callControlsWrapper,
        {
          paddingBottom: Math.max(bottom, appTheme.spacing.lg),
        },
      ]}
    >
      <ReactionButton />
      <ChatButton
        onPressHandler={chatButton?.onPressHandler}
        unreadBadgeCount={chatButton?.unreadBadgeCount}
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
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: appTheme.spacing.md,
    zIndex: Z_INDEX.IN_FRONT,
    backgroundColor: appTheme.colors.static_grey,
  },
});
