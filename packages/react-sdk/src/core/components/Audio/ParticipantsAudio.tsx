import { ComponentProps, Fragment } from 'react';
import { StreamVideoParticipant } from '@stream-io/video-client';
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
        const { audioStream, screenShareAudioStream, sessionId } = participant;

        // gate on the stream, not on publishedTracks: the stream survives a
        // mute, so the <audio> element isn't remounted on every unmute
        const audioTrackElement = audioStream && (
          <Audio
            {...audioProps}
            trackType="audioTrack"
            participant={participant}
          />
        );

        const screenShareAudioTrackElement = screenShareAudioStream && (
          <Audio
            {...audioProps}
            trackType="screenShareAudioTrack"
            participant={participant}
          />
        );

        return (
          <Fragment key={sessionId}>
            {audioTrackElement}
            {screenShareAudioTrackElement}
          </Fragment>
        );
      })}
    </>
  );
};

ParticipantsAudio.displayName = 'ParticipantsAudio';
