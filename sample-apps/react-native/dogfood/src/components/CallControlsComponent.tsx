import {
  CallContentProps,
  ChatButton,
  HangUpCallButton,
  ReactionsButton,
  ToggleAudioPublishingButton,
  ToggleCameraFaceButton,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { appTheme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Z_INDEX } from '../constants';

export type CallControlsComponentProps = Pick<
  CallContentProps,
  'supportedReactions'
> & {
  onChatOpenHandler?: () => void;
  onHangupCallHandler?: () => void;
  unreadCountIndicator?: number;
  landscape?: boolean;
};

export const CallControlsComponent = ({
  onChatOpenHandler,
  onHangupCallHandler,
  unreadCountIndicator,
  landscape,
}: CallControlsComponentProps) => {
  const { bottom } = useSafeAreaInsets();
  const landscapeStyles: ViewStyle = {
    flexDirection: landscape ? 'column-reverse' : 'row',
    paddingHorizontal: landscape ? 12 : 0,
    paddingVertical: landscape ? 0 : 12,
    paddingBottom: landscape ? 0 : Math.max(bottom, appTheme.spacing.lg),
  };

  const onPress = () => {
    // @ts-ignore
    navigator.mediaDevices.getDisplayMedia({ deviceId: 'broadcast' });
  };

  return (
    <View style={[styles.callControlsWrapper, landscapeStyles]}>
      <ReactionsButton />
      <ChatButton
        onPressHandler={onChatOpenHandler}
        unreadBadgeCount={unreadCountIndicator}
      />
      <ToggleVideoPublishingButton />
      <ToggleAudioPublishingButton />
      <ToggleCameraFaceButton />
      <HangUpCallButton onPressHandler={onHangupCallHandler} />
      <HangUpCallButton onPressHandler={onPress} />
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
