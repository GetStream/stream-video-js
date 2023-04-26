import { ComponentType } from 'react';
import { OwnCapability, StreamVideoParticipant } from '@stream-io/video-client';
import { useCall } from '@stream-io/video-react-bindings';
import { TextButton } from '../Button';
import { Restricted } from '../Moderation';
import { CallParticipantListingItem } from './CallParticipantListingItem';

// FIXME: will probably cease to exist with new design
const CallParticipantListingHeader = () => {
  const activeCall = useCall();

  const muteAllClickHandler = () => {
    activeCall?.muteAllUsers('audio');
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>Active users</div>
      <Restricted requiredGrants={[OwnCapability.MUTE_USERS]}>
        <TextButton onClick={muteAllClickHandler}>Mute all</TextButton>
      </Restricted>
    </div>
  );
};

export type CallParticipantListingProps = {
  /** Array of participant objects to be rendered */
  data: StreamVideoParticipant[];
  Header?: ComponentType;
};

export const CallParticipantListing = ({
  data,
  Header = CallParticipantListingHeader,
}: CallParticipantListingProps) => (
  <>
    {Header && <Header />}
    <div className="str-video__participant-listing">
      {data.map((participant) => (
        <CallParticipantListingItem
          key={participant.sessionId}
          participant={participant}
        />
      ))}
    </div>
  </>
);
