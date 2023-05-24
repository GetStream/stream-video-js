import { Restricted, useCall } from '@stream-io/video-react-bindings';
import { OwnCapability } from '@stream-io/video-client';

import { TextButton } from '../Button';

export const BlockedUserListing = ({ data }: { data: string[] }) => {
  if (!data.length) return null;

  return (
    <>
      <div className="str-video__participant-listing">
        {data.map((userId) => (
          <BlockedUserListingItem key={userId} userId={userId} />
        ))}
      </div>
    </>
  );
};

const BlockedUserListingItem = ({ userId }: { userId: string }) => {
  const call = useCall();

  const unblockUserClickHandler = () => {
    if (userId) call?.unblockUser(userId);
  };

  return (
    <div className="str-video__participant-listing-item">
      <div className="str-video__participant-listing-item__display-name">
        {userId}
      </div>
      <Restricted requiredGrants={[OwnCapability.BLOCK_USERS]}>
        <TextButton onClick={unblockUserClickHandler}>Unblock</TextButton>
      </Restricted>
    </div>
  );
};
