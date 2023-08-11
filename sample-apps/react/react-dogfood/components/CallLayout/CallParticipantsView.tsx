import {
  DefaultParticipantViewUI,
  ParticipantView,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

export const CallParticipantsView = () => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const grid = `str-video__grid-${participants.length || 1}`;
  return (
    <div className={`str-video__call-participants-view ${grid}`}>
      {participants.map((participant) => (
        <ParticipantView
          key={participant.sessionId}
          participant={participant}
          ParticipantViewUI={DefaultParticipantViewUI}
        />
      ))}
    </div>
  );
};
