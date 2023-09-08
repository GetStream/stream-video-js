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
          participant={participant}
          muted={participant.sessionId === dominantSpeaker?.sessionId}
        />
      ))}
    </div>
  );
};
