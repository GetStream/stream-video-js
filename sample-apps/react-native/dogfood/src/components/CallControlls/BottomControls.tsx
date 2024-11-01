import {
  CallContentProps,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCallStateHooks,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../../theme';
import { Z_INDEX } from '../../constants';
import { MoreActionsButton } from './MoreActionsButton';
import { ParticipantsButton } from './ParticipantsButton';
import { ChatButton } from './ChatButton';
import { RecordCallButton } from './RecordCallButton';
import { AudioButton } from './AudioButton';

export type BottomControlsProps = Pick<
  CallContentProps,
  'supportedReactions'
> & {
  onChatOpenHandler?: () => void;
  onParticipantInfoPress?: () => void;
  unreadCountIndicator?: number;
};

export const CallControlsComponent = ({
  onChatOpenHandler,
  unreadCountIndicator,
  onParticipantInfoPress,
}: BottomControlsProps) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isSpeakingWhileMuted } = useMicrophoneState();
  const styles = useStyles(isSpeakingWhileMuted);

  return (
    <View style={styles.container}>
      {isSpeakingWhileMuted && (
        <View style={styles.speakingLabelContainer}>
          <Text style={styles.label}>You are muted. Unmute to speak.</Text>
        </View>
      )}
      <View style={[styles.callControlsWrapper]}>
        <View style={styles.left}>
          <MoreActionsButton />
          <AudioButton />
          <ToggleAudioPublishingButton />
          <ToggleVideoPublishingButton />
          <RecordCallButton />
        </View>
        <View style={styles.right}>
          <ParticipantsButton onParticipantInfoPress={onParticipantInfoPress} />
          <ChatButton
            onPressHandler={onChatOpenHandler}
            unreadBadgeCount={unreadCountIndicator}
          />
        </View>
      </View>
    </View>
  );
};

const useStyles = (showMicLabel: boolean) => {
  const { theme } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingVertical: !showMicLabel ? theme.variants.spacingSizes.md : 0,
          paddingHorizontal: theme.variants.spacingSizes.md,
          backgroundColor: theme.colors.sheetPrimary,
          height: 76,
        },
        speakingLabelContainer: {
          backgroundColor: appTheme.colors.static_overlay,
          width: '100%',
        },
        label: {
          textAlign: 'center',
          color: appTheme.colors.static_white,
        },
        callControlsWrapper: {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          zIndex: Z_INDEX.IN_FRONT,
        },
        left: {
          flex: 2.5,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: theme.variants.spacingSizes.xs,
        },
        right: {
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: theme.variants.spacingSizes.xs,
        },
      }),
    [theme, showMicLabel],
  );
};
