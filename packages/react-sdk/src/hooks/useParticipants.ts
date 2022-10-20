import { useEffect, useState } from 'react';
import {
  StreamVideoClient,
  StreamVideoParticipant,
} from '@stream-io/video-client';

export const useParticipants = (client: StreamVideoClient) => {
  const [participants, setParticipants] = useState<StreamVideoParticipant[]>(
    client.readOnlyStateStore.getCurrentValue(
      client.readOnlyStateStore.activeCallParticipants$,
    ),
  );
  useEffect(() => {
    const subscription =
      client.readOnlyStateStore.activeCallParticipants$.subscribe(
        (participants) => setParticipants(participants),
      );

    return () => subscription.unsubscribe();
  }, [client]);
  return participants;
};
