import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MicOff,
  PinVertical,
  ScreenShareIndicator,
  VideoSlash,
} from '../../../icons';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { ComponentTestIds } from '../../../constants/TestIds';
import { type ParticipantViewProps } from './ParticipantView';
import { Z_INDEX } from '../../../constants';
import { hasAudio, hasVideo } from '@stream-io/video-client';
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
        audioMutedIconContainer,
        videoMutedIconContainer,
        pinIconContainer,
        screenShareIconContainer,
      },
    },
  } = useTheme();
  const styles = useStyles();
  const { name, userId, pin, sessionId, isLocalParticipant } = participant;
  const call = useCall();
  const { t } = useI18n();
  const participantName = name ?? userId;

  const participantLabel = isLocalParticipant ? t('You') : participantName;
  const isPinningEnabled = pin?.isLocalPin;
  const isAudioMuted = !hasAudio(participant);
  const isVideoMuted = !hasVideo(participant);

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
          { backgroundColor: colors.sheetOverlay },
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
          <ScreenShareIndicator color={colors.iconPrimary} />
        </View>
        <Text
          style={[
            styles.userNameLabel,
            { color: colors.textPrimary },
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
        { backgroundColor: colors.sheetOverlay },
        container,
      ]}
    >
      <View style={styles.wrapper}>
        <Text style={[styles.userNameLabel, userNameLabel]} numberOfLines={1}>
          {participantLabel}
        </Text>
        {isAudioMuted && (
          <View
            style={[styles.audioMutedIconContainer, audioMutedIconContainer]}
          >
            <MicOff color={colors.iconPrimary} size={iconSizes.sm} />
          </View>
        )}
        {isVideoMuted && (
          <View
            style={[styles.videoMutedIconContainer, videoMutedIconContainer]}
          >
            <VideoSlash color={colors.iconPrimary} size={iconSizes.sm} />
          </View>
        )}
        {isPinningEnabled && (
          <Pressable
            style={[styles.pinIconContainer, pinIconContainer]}
            onPress={unPinParticipantHandler}
          >
            <PinVertical color={colors.iconPrimary} size={iconSizes.sm} />
          </Pressable>
        )}
        <View style={styles.indicatorWrapper}>
          <SpeechIndicator
            isSpeaking={!isAudioMuted && participant.isDominantSpeaker}
          />
        </View>
      </View>
    </View>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        indicatorWrapper: {
          marginLeft: theme.variants.spacingSizes.sm,
        },
        wrapper: {
          flexDirection: 'row',
        },
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.variants.spacingSizes.sm,
          maxHeight: 30,
          borderTopRightRadius: 5,
          marginBottom: -2,
          flexShrink: 1,
          zIndex: Z_INDEX.IN_FRONT,
        },
        userNameLabel: {
          flexShrink: 1,
          marginTop: 3,
          fontSize: 13,
          fontWeight: '400',
          color: theme.colors.textPrimary,
        },
        screenShareIconContainer: {
          marginRight: theme.variants.spacingSizes.sm,
          justifyContent: 'center',
        },
        audioMutedIconContainer: {
          marginLeft: theme.variants.spacingSizes.xs,
          justifyContent: 'center',
        },
        videoMutedIconContainer: {
          marginLeft: theme.variants.spacingSizes.xs,
          justifyContent: 'center',
        },
        pinIconContainer: {
          marginLeft: theme.variants.spacingSizes.xs,
          justifyContent: 'center',
        },
      }),
    [theme],
  );
};
