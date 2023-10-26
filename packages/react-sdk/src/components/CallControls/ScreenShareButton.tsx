import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { CompositeButton, IconButton } from '../Button/';
import { PermissionNotification } from '../Notification';
import { useToggleScreenShare } from '../../hooks';

export type ScreenShareButtonProps = {
  caption?: string;
};

export const ScreenShareButton = (props: ScreenShareButtonProps) => {
  const call = useCall();
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const isSomeoneScreenSharing = useHasOngoingScreenShare();

  const { t } = useI18n();
  const { caption = t('Screen Share') } = props;

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
