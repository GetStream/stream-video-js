import { useEffect, useState } from 'react';
import { Call } from '@stream-io/video-client';
import { Participant } from '@stream-io/video-client/dist/src/gen-sfu/sfu_models/models';

export const useParticipants = (
  call: Call,
  initialParticipants: Participant[],
) => {
  const [participants, setParticipants] = useState(initialParticipants);
  useEffect(() => {
    return call.on('participantJoined', (e) => {
      if (e.eventPayload.oneofKind !== 'participantJoined') return;
      const { participant } = e.eventPayload.participantJoined;
      if (participant) {
        setParticipants((ps) => [...ps, participant]);
      }
    });
  }, [call]);

  useEffect(() => {
    return call.on('participantLeft', (e) => {
      if (e.eventPayload.oneofKind !== 'participantLeft') return;
      const { participant } = e.eventPayload.participantLeft;
      if (participant) {
        setParticipants((ps) =>
          ps.filter((p) => p.user!.id !== participant.user!.id),
        );
      }
    });
  }, [call]);

  return participants;
};
