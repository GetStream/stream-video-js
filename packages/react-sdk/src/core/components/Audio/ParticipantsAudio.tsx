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
      {participants.map(
        (participant) =>
          !participant.isLocalParticipant &&
          participant.publishedTracks.includes(SfuModels.TrackType.AUDIO) &&
          participant.audioStream && (
            <Audio
              {...audioProps}
              participant={participant}
              key={participant.sessionId}
            />
          ),
      )}
    </>
  );
};
