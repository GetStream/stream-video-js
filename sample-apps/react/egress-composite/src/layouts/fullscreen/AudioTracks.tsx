import { Audio, StreamVideoParticipant } from '@stream-io/video-react-sdk';

export const AudioTracks = (props: {
  participants: StreamVideoParticipant[];
  dominantSpeaker?: StreamVideoParticipant;
}) => {
  const { participants, dominantSpeaker } = props;
  return (
    <div className="audio-elements">
      {participants.map((participant) => (
        <Audio
          key={participant.sessionId}
          audioStream={participant.audioStream}
          muted={participant.sessionId === dominantSpeaker?.sessionId}
          data-userId={participant.userId}
        />
      ))}
    </div>
  );
};
