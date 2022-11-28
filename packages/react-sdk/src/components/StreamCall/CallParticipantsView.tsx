import { Call } from '@stream-io/video-client';
import { ParticipantBox } from './ParticipantBox';
import {
  useLocalParticipant,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';

export const CallParticipantsView = (props: { call: Call }) => {
  const { call } = props;
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const grid = `str-video__grid-${remoteParticipants.length + 1 || 1}`;
  return (
    <div className={`str-video__call-participants-view ${grid}`}>
      {localParticipant && (
        <ParticipantBox participant={localParticipant} isMuted call={call} />
      )}

      {remoteParticipants.map((participant) => (
        <ParticipantBox
          key={participant.sessionId}
          participant={participant}
          call={call}
        />
      ))}
    </div>
  );
};
