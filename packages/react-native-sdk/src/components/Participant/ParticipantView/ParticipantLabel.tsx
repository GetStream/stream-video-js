import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PinVertical, ScreenShareIndicator } from '../../../icons';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { ComponentTestIds } from '../../../constants/TestIds';
import { ParticipantViewProps } from './ParticipantView';
import { Z_INDEX } from '../../../constants';
import { useTheme } from '../../../contexts/ThemeContext';
import SpeechIndicator from './SpeechIndicator';

/**
 * Props for the ParticipantLabel component.
 */
export type ParticipantLabelProps = Pick<
  ParticipantViewProps,
  'trackType' | 'participant'
>;

/**
 * This component is used to display the participant label that contains the participant name, video/audio mute/unmute status.
 */
export const ParticipantLabel = ({
  participant,
  trackType,
}: ParticipantLabelProps) => {
  const {
    theme: {
      colors,
      typefaces,
      variants: { iconSizes },
      participantLabel: {
        container,
        userNameLabel,
        pinIconContainer,
        screenShareIconContainer,
      },
    },
  } = useTheme();
  const { name, userId, pin, sessionId, isLocalParticipant } = participant;
  const call = useCall();
  const { t } = useI18n();
  const participantName = name ?? userId;

  const participantLabel = isLocalParticipant ? t('You') : participantName;
  const isPinningEnabled = pin?.isLocalPin;

  const unPinParticipantHandler = () => {
    call?.unpin(sessionId);
  };

  if (trackType === 'screenShareTrack') {
    const screenShareText = isLocalParticipant
      ? t('You are sharing your screen')
      : t('{{ userName }} is sharing their screen', {
          userName: participantName,
        });
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background6 },
          container,
        ]}
        testID={ComponentTestIds.PARTICIPANT_SCREEN_SHARING}
      >
        <View
          style={[
            styles.screenShareIconContainer,
            { height: iconSizes.md, width: iconSizes.md },
            screenShareIconContainer,
          ]}
        >
          <ScreenShareIndicator color={colors.base1} />
        </View>
        <Text
          style={[
            styles.userNameLabel,
            { color: colors.base1 },
            typefaces.caption,
            userNameLabel,
          ]}
          numberOfLines={1}
        >
          {screenShareText}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: 'rgba(12, 13, 14, 0.65)' },
        container,
      ]}
    >
      <View style={styles.wrapper}>
        <Text
          style={[
            styles.userNameLabel,
            { color: colors.base1 },
            typefaces.subtitle,
            userNameLabel,
          ]}
          numberOfLines={1}
        >
          {participantLabel}
        </Text>
        <View style={styles.indicatorWrapper}>
          <SpeechIndicator isSpeaking={participant.isDominantSpeaker} />
        </View>
      </View>
      {isPinningEnabled && (
        <Pressable
          style={[
            styles.pinIconContainer,
            { height: iconSizes.xs, width: iconSizes.xs },
            pinIconContainer,
          ]}
          onPress={unPinParticipantHandler}
        >
          <PinVertical color={colors.base1} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  indicatorWrapper: {
    marginLeft: 7,
  },
  wrapper: {
    flexDirection: 'row',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    maxHeight: 30,
    borderTopRightRadius: 5,
    marginBottom: -2,
    flexShrink: 1,
    zIndex: Z_INDEX.IN_FRONT,
  },
  userNameLabel: {
    flexShrink: 1,
    marginTop: 2,
  },
  screenShareIconContainer: {
    marginRight: 8,
  },
  audioMutedIconContainer: {
    marginLeft: 4,
  },
  videoMutedIconContainer: {
    marginLeft: 4,
  },
  pinIconContainer: {
    marginLeft: 4,
  },
});
