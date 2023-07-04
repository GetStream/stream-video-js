import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useHasOngoingScreenShare,
} from '@stream-io/video-react-bindings';
import { CompositeButton, IconButton } from '../Button/';
import { PermissionNotification } from '../Notification';
import { useToggleScreenShare } from '../../hooks';

export type ScreenShareButtonProps = {
  caption?: string;
};

export const ScreenShareButton = ({
  caption = 'Screen Share',
}: ScreenShareButtonProps) => {
  const call = useCall();
  const isSomeoneScreenSharing = useHasOngoingScreenShare();

  const { toggleScreenShare, isAwaitingPermission, isScreenSharing } =
    useToggleScreenShare();

  return (
    <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
      <PermissionNotification
        permission={OwnCapability.SCREENSHARE}
        isAwaitingApproval={isAwaitingPermission}
        messageApproved="You can now share your screen."
        messageAwaitingApproval="Awaiting for an approval to share screen."
        messageRevoked="You can no longer share your screen."
      >
        <CompositeButton active={isSomeoneScreenSharing} caption={caption}>
          <IconButton
            icon={isScreenSharing ? 'screen-share-on' : 'screen-share-off'}
            title="Share screen"
            disabled={(!isScreenSharing && isSomeoneScreenSharing) || !call}
            onClick={toggleScreenShare}
          />
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
