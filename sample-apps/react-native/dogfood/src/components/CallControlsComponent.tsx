import {
  CallContentProps,
  ChatButton,
  HangUpCallButton,
  ReactionsButton,
  ToggleAudioPublishingButton,
  ToggleCameraFaceButton,
  ToggleVideoPublishingButton,
  ScreenShareToggleButton,
  useCallStateHooks,
  BackgroundFiltersProvider,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { appTheme } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Z_INDEX } from '../constants';
import { VideoFilterButton } from './BlurVideoFilterButton';

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
  const { useMicrophoneState } = useCallStateHooks();
  const { isSpeakingWhileMuted } = useMicrophoneState();
  const landscapeStyles: ViewStyle = {
    flexDirection: landscape ? 'column-reverse' : 'row',
    paddingHorizontal: landscape ? 12 : 0,
    paddingVertical: landscape ? 0 : 12,
    paddingBottom: landscape ? 0 : Math.max(bottom, appTheme.spacing.lg),
  };

  return (
    <BackgroundFiltersProvider>
      <View>
        {isSpeakingWhileMuted && (
          <View style={styles.speakingLabelContainer}>
            <Text style={styles.label}>You are muted. Unmute to speak.</Text>
          </View>
        )}
        <View style={[styles.callControlsWrapper, landscapeStyles]}>
          <ReactionsButton />
          <VideoFilterButton />
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
    </BackgroundFiltersProvider>
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
