import React from 'react';
import { ScreenShare } from '../../../icons';
import {
  useI18n,
  useIsAudioConnecting,
  useIsVideoConnecting,
} from '@stream-io/video-react-bindings';
import { ComponentTestIds } from '../../../constants/TestIds';
import { type ParticipantViewProps } from './ParticipantView';
import { hasAudio, hasPausedTrack, hasVideo } from '@stream-io/video-client';
import { useTheme } from '../../../contexts/ThemeContext';
import { StatusLabel } from '../../utility/StatusLabel';

/**
 * Props for the ParticipantLabel component.
 */
export type ParticipantLabelProps = Pick<
  ParticipantViewProps,
  'trackType' | 'participant'
>;

/**
 * This component is used to display the participant label that contains the participant name, video/audio mute/unmute status.
 *
 * It reads the statuses off the participant's tracks and hands them to
 * {@link StatusLabel}, which does the rendering.
 */
export const ParticipantLabel = ({
  participant,
  trackType,
}: ParticipantLabelProps) => {
  const {
    theme: { components, semantics },
  } = useTheme();
  const { name, userId, pin, isLocalParticipant, isDominantSpeaker } =
    participant;
  const { t } = useI18n();
  const participantName = name ?? userId;

  const isAudioMuted = !hasAudio(participant);
  const isVideoMuted = !hasVideo(participant);
  const isTrackPaused = !!trackType && hasPausedTrack(participant, trackType);
  const isAudioConnecting = useIsAudioConnecting(participant);
  const isVideoConnecting = useIsVideoConnecting(participant);

  if (trackType === 'screenShareTrack') {
    const screenShareText = isLocalParticipant
      ? t('You are sharing your screen')
      : t('{{ userName }} is sharing their screen', {
          userName: participantName,
        });

    return (
      <StatusLabel
        testID={ComponentTestIds.PARTICIPANT_SCREEN_SHARING}
        label={screenShareText}
        leadingIcon={
          <ScreenShare
            color={semantics.textOnAccent}
            size={components.iconSizeSm}
          />
        }
        showSpeechIndicator={false}
      />
    );
  }

  return (
    <StatusLabel
      label={isLocalParticipant ? t('You') : participantName}
      isConnecting={isAudioConnecting || isVideoConnecting}
      isAudioMuted={isAudioMuted}
      isVideoMuted={isVideoMuted}
      isTrackPaused={isTrackPaused}
      isPinned={!!pin}
      isSpeaking={!isAudioMuted && isDominantSpeaker}
    />
  );
};
