import {
  CallContentProps,
  ChatButton,
  HangUpCallButton,
  ReactionsButton,
  ScreenShareToggleButton,
  ToggleAudioPublishingButton,
  ToggleCameraFaceButton,
  ToggleVideoPublishingButton,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { appTheme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Z_INDEX } from '../constants';
import { VideoEffectsButton } from './VideoEffectsButton';
import { ClosedCaptions } from './ClosedCaptions';

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
  const { useMicrophoneState, useIsCallCaptioningInProgress } =
    useCallStateHooks();
  const { isSpeakingWhileMuted } = useMicrophoneState();
  const isCaptioningInProgress = useIsCallCaptioningInProgress();
  const landscapeStyles: ViewStyle = {
    flexDirection: landscape ? 'column-reverse' : 'row',
    paddingHorizontal: landscape ? 12 : 0,
    paddingVertical: landscape ? 0 : 12,
    paddingBottom: landscape ? 0 : Math.max(bottom, appTheme.spacing.lg),
  };

  return (
    <View>
      {isSpeakingWhileMuted && (
        <View style={styles.speakingLabelContainer}>
          <Text style={styles.label}>You are muted. Unmute to speak.</Text>
        </View>
      )}
      {isCaptioningInProgress && <ClosedCaptions />}
      <View style={[styles.callControlsWrapper, landscapeStyles]}>
        <ReactionsButton />
        <VideoEffectsButton />
        <ChatButton
          onPressHandler={onChatOpenHandler}
          unreadBadgeCount={unreadCountIndicator}
        />
        <ScreenShareToggleButton />
        <ToggleVideoPublishingButton />
        <ToggleAudioPublishingButton />
        <ToggleCameraFaceButton />
        <HangUpCallButton onPressHandler={onHangupCallHandler} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  speakingLabelContainer: {
    backgroundColor: appTheme.colors.static_overlay,
    paddingVertical: 10,
    width: '100%',
  },
  label: {
    textAlign: 'center',
    color: appTheme.colors.static_white,
  },
  callControlsWrapper: {
    justifyContent: 'space-evenly',
    zIndex: Z_INDEX.IN_FRONT,
    backgroundColor: appTheme.colors.static_grey,
  },
});
