import { ComponentType } from 'react';
import {
  DefaultParticipantViewUI,
  ParticipantView,
  getCallStateHooks,
} from '@stream-io/video-react-sdk';

const { useParticipants } = getCallStateHooks();
export const CallParticipantsView = ({
  ParticipantViewUI,
}: {
  ParticipantViewUI?: ComponentType;
}) => {
  const participants = useParticipants();
  const grid = `str-video__grid-${participants.length || 1}`;
  return (
    <div className={`str-video__call-participants-view ${grid}`}>
      {participants.map((participant) => (
        <ParticipantView
          key={participant.sessionId}
          participant={participant}
          ParticipantViewUI={ParticipantViewUI || DefaultParticipantViewUI}
        />
      ))}
    </div>
  );
};
