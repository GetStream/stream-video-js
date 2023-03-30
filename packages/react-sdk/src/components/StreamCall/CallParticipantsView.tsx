import { Call } from '@stream-io/video-client';
import { ParticipantBox } from './ParticipantBox';
import {
  useLocalParticipant,
  useParticipants,
} from '@stream-io/video-react-bindings';

export const CallParticipantsView = (props: { call: Call }) => {
  const { call } = props;
  const localParticipant = useLocalParticipant();
  const participants = useParticipants();
  const grid = `str-video__grid-${participants.length || 1}`;
  return (
    <div className={`str-video__call-participants-view ${grid}`}>
      {participants.map((participant) => (
        <ParticipantBox
          key={participant.sessionId}
          participant={participant}
          call={call}
          sinkId={localParticipant?.audioOutputDeviceId}
        />
      ))}
    </div>
  );
};
