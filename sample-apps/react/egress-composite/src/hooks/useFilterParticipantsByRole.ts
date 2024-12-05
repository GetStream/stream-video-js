import { StreamVideoParticipant } from '@stream-io/video-react-sdk';
import { useMemo } from 'react';

export function useFilterParticipantByRole(includeRoles: string[] | undefined) {
  return useMemo(
    () =>
      includeRoles
        ? (participant: StreamVideoParticipant) =>
            participant.roles.some((role) => includeRoles.includes(role))
        : undefined,
    [includeRoles],
  );
}
