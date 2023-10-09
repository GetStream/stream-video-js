import { ComponentProps } from 'react';
import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { Audio } from './Audio';

export type ParticipantsAudioProps = {
  /**
   * The participants to play audio for.
   */
  participants: StreamVideoParticipant[];

  /**
   * Props to pass to the underlying `Audio` components.
   */
  audioProps?: ComponentProps<typeof Audio>;
};

export const ParticipantsAudio = (props: ParticipantsAudioProps) => {
  const { participants, audioProps } = props;
  return (
    <>
      {participants.map((participant) => {
        if (participant.isLocalParticipant) return null;
        const hasAudio = participant.publishedTracks.includes(
          SfuModels.TrackType.AUDIO,
        );
        const hasScreenShareAudio = participant.publishedTracks.includes(
          SfuModels.TrackType.SCREEN_SHARE_AUDIO,
        );
        if (hasAudio && participant.audioStream) {
          return (
            <Audio
              {...audioProps}
              trackType="audioTrack"
              participant={participant}
              key={participant.sessionId}
            />
          );
        }
        if (hasScreenShareAudio && participant.screenShareAudioStream) {
          return (
            <Audio
              {...audioProps}
              trackType="screenShareAudioTrack"
              participant={participant}
              key={participant.sessionId}
            />
          );
        }
        return null;
      })}
    </>
  );
};
