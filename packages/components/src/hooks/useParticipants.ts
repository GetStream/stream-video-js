import { useEffect, useState } from 'react';
import { Room } from '@stream-io/video-client-sfu';
import { Participant } from '@stream-io/video-client-sfu/dist/src/gen/sfu_models/models';

export const useParticipants = (
  room: Room,
  initialParticipants: Participant[],
) => {
  const [participants, setParticipants] = useState(initialParticipants);
  useEffect(() => {
    return room.on('participantJoined', (e) => {
      if (e.eventPayload.oneofKind !== 'participantJoined') return;
      const { participant } = e.eventPayload.participantJoined;
      if (participant) {
        setParticipants((ps) => [...ps, participant]);
      }
    });
  }, [room]);

  useEffect(() => {
    return room.on('participantLeft', (e) => {
      if (e.eventPayload.oneofKind !== 'participantLeft') return;
      const { participant } = e.eventPayload.participantLeft;
      if (participant) {
        setParticipants((ps) =>
          ps.filter((p) => p.user!.id !== participant.user!.id),
        );
      }
    });
  }, [room]);

  return participants;
};
