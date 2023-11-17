import { ComponentProps, Fragment } from 'react';
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
        const {
          publishedTracks,
          audioStream,
          screenShareAudioStream,
          sessionId,
        } = participant;

        const hasAudio = publishedTracks.includes(SfuModels.TrackType.AUDIO);
        const audioTrackElement = hasAudio && audioStream && (
          <Audio
            {...audioProps}
            trackType="audioTrack"
            participant={participant}
          />
        );

        const hasScreenShareAudio = publishedTracks.includes(
          SfuModels.TrackType.SCREEN_SHARE_AUDIO,
        );
        const screenShareAudioTrackElement = hasScreenShareAudio &&
          screenShareAudioStream && (
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
