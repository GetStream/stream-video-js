import { ComponentType } from 'react';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { CallParticipantListingItem } from './CallParticipantListingItem';

export type CallParticipantListingProps = {
  /** Array of participant objects to be rendered */
  data: StreamVideoParticipant[];
  Header?: ComponentType;
};

export const CallParticipantListing = ({
  data,
}: CallParticipantListingProps) => (
  <div className="str-video__participant-listing">
    {data.map((participant) => (
      <CallParticipantListingItem
        key={participant.sessionId}
        participant={participant}
      />
    ))}
  </div>
);
