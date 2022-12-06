import { SfuModels } from '@stream-io/video-client';
import { Call } from '@stream-io/video-client';
import {
  useLocalParticipant,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';

import { useStage } from '../../hooks';

import { ParticipantBox } from './ParticipantBox';

export const Stage = ({
  call,
}: {
  call: Call;
  participants: SfuModels.Participant[];
}) => {
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const { updateVideoSubscriptionForParticipant } = useStage(call);

  const grid = `str-video__grid-${remoteParticipants.length + 1 || 1}`;
  return (
    <div className={`str-video__stage ${grid}`}>
      {localParticipant && (
        <ParticipantBox
          participant={localParticipant}
          isMuted
          call={call}
          sinkId={localParticipant?.audioOutputDeviceId}
          updateVideoSubscriptionForParticipant={
            updateVideoSubscriptionForParticipant
          }
        />
      )}

      {remoteParticipants.map((participant) => (
        <ParticipantBox
          key={participant.sessionId}
          participant={participant}
          call={call}
          sinkId={localParticipant?.audioOutputDeviceId}
          updateVideoSubscriptionForParticipant={
            updateVideoSubscriptionForParticipant
          }
        />
      ))}
    </div>
  );
};
