import {
  CallContentProps,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../../theme';
import { Z_INDEX } from '../../constants';
import { MoreActionsButton } from './MoreActionsButton';
import { ParticipantsButton } from './ParticipantsButton';
import { ChatButton } from './ChatButton';
import { RecordCallButton } from './RecordCallButton';
import { AudioButton } from './AudioButton';

export type CallControlsComponentProps = Pick<
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
}: CallControlsComponentProps) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isSpeakingWhileMuted } = useMicrophoneState();

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
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    zIndex: Z_INDEX.IN_FRONT,
  },
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'black',
    height: 76,
  },
  left: {
    flex: 2.5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  right: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
});
