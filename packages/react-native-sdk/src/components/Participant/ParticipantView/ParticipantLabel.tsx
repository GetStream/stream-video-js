import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  MicOff,
  PinVertical,
  ScreenShareIndicator,
  VideoSlash,
} from '../../../icons';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { ComponentTestIds } from '../../../constants/TestIds';
import { ParticipantViewProps } from './ParticipantView';
import { Z_INDEX } from '../../../constants';
import { SfuModels } from '@stream-io/video-client';
import { useTheme } from '../../../contexts/ThemeContext';

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
  const { name, userId, pin, publishedTracks, sessionId, isLocalParticipant } =
    participant;
  const call = useCall();
  const { t } = useI18n();
  const participantName = name ?? userId;

  const participantLabel = isLocalParticipant ? t('You') : participantName;
  const isPinningEnabled = pin?.isLocalPin;
  const isAudioMuted = !publishedTracks.includes(SfuModels.TrackType.AUDIO);
  const isVideoMuted = !publishedTracks.includes(SfuModels.TrackType.VIDEO);

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
          { backgroundColor: colors.static_overlay },
          container,
        ]}
        testID={ComponentTestIds.PARTICIPANT_SCREEN_SHARING}
      >
        <View
          style={[
            styles.screenShareIconContainer,
            {
              height: iconSizes.md,
              width: iconSizes.md,
            },
            screenShareIconContainer,
          ]}
        >
          <ScreenShareIndicator color={colors.static_white} />
        </View>
        <Text
          style={[
            styles.userNameLabel,
            { color: colors.static_white },
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
        { backgroundColor: colors.static_overlay },
        container,
      ]}
    >
      <Text
        style={[
          styles.userNameLabel,
          { color: colors.static_white },
          typefaces.caption,
          userNameLabel,
        ]}
        numberOfLines={1}
      >
        {participantLabel}
      </Text>
      {isAudioMuted && (
        <View
          style={[
            styles.audioMutedIconContainer,
            {
              height: iconSizes.xs,
              width: iconSizes.xs,
            },
            audioMutedIconContainer,
          ]}
        >
          <MicOff color={colors.error} />
        </View>
      )}
      {isVideoMuted && (
        <View
          style={[
            styles.videoMutedIconContainer,
            {
              height: iconSizes.xs,
              width: iconSizes.xs,
            },
            videoMutedIconContainer,
          ]}
        >
          <VideoSlash color={colors.error} />
        </View>
      )}
      {isPinningEnabled && (
        <Pressable
          style={[
            styles.pinIconContainer,
            {
              height: iconSizes.xs,
              width: iconSizes.xs,
            },
            pinIconContainer,
          ]}
          onPress={unPinParticipantHandler}
        >
          <PinVertical color={colors.static_white} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 5,
    flexShrink: 1,
    zIndex: Z_INDEX.IN_FRONT,
  },
  userNameLabel: {
    flexShrink: 1,
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
