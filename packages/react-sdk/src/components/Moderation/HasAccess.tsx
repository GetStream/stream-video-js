import { PropsWithChildren } from 'react';
import {
  OwnCapabilities,
  StreamVideoLocalParticipant,
} from '@stream-io/video-client';

export const HasAccess = ({
  participant,
  requires,
  children,
}: PropsWithChildren<{
  participant: StreamVideoLocalParticipant;
  requires: OwnCapabilities;
}>) => {
  if (
    requires.some((capability) =>
      participant.ownCapabilities.includes(capability),
    )
  )
    return <>{children}</>;
  return null;
};
