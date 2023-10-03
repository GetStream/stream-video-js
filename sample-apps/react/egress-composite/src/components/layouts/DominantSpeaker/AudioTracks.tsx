import { Audio, StreamVideoParticipant } from '@stream-io/video-react-sdk';

export const AudioTracks = ({
  participants,
  dominantSpeaker,
}: {
  participants: StreamVideoParticipant[];
  dominantSpeaker?: StreamVideoParticipant;
}) => (
  <>
    {participants.map((participant) => (
      <Audio
        key={participant.sessionId}
        participant={participant}
        muted={participant.sessionId === dominantSpeaker?.sessionId}
      />
    ))}
  </>
);
