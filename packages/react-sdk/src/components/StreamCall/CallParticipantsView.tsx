import { DefaultParticipantViewUI, ParticipantView } from '../../core';
import {
  useLocalParticipant,
  useParticipants,
} from '@stream-io/video-react-bindings';

export const CallParticipantsView = () => {
  const localParticipant = useLocalParticipant();
  const participants = useParticipants();
  const grid = `str-video__grid-${participants.length || 1}`;
  return (
    <div className={`str-video__call-participants-view ${grid}`}>
      {participants.map((participant) => (
        <ParticipantView
          key={participant.sessionId}
          participant={participant}
          sinkId={localParticipant?.audioOutputDeviceId}
          ParticipantViewUI={DefaultParticipantViewUI}
        />
      ))}
    </div>
  );
};
