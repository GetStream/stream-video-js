import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useHasOngoingScreenShare,
  useI18n,
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

  const { t } = useI18n();
  const { toggleScreenShare, isAwaitingPermission, isScreenSharing } =
    useToggleScreenShare();

  return (
    <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
      <PermissionNotification
        permission={OwnCapability.SCREENSHARE}
        isAwaitingApproval={isAwaitingPermission}
        messageApproved={t('You can now share your screen.')}
        messageAwaitingApproval={t('Awaiting for an approval to share screen.')}
        messageRevoked={t('You can no longer share your screen.')}
      >
        <CompositeButton active={isSomeoneScreenSharing} caption={caption}>
          <IconButton
            icon={isScreenSharing ? 'screen-share-on' : 'screen-share-off'}
            title={t('Share screen')}
            disabled={(!isScreenSharing && isSomeoneScreenSharing) || !call}
            onClick={toggleScreenShare}
          />
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
