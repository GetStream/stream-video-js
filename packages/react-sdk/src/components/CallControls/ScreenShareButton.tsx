import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { CompositeButton } from '../Button/';
import { PermissionNotification } from '../Notification';
import { useRequestPermission } from '../../hooks';
import { Icon } from '../Icon';

export type ScreenShareButtonProps = {
  caption?: string;
};

export const ScreenShareButton = (props: ScreenShareButtonProps) => {
  const { t } = useI18n();
  const { caption } = props;

  const { useHasOngoingScreenShare, useScreenShareState } = useCallStateHooks();
  const isSomeoneScreenSharing = useHasOngoingScreenShare();
  const { hasPermission, requestPermission, isAwaitingPermission } =
    useRequestPermission(OwnCapability.SCREENSHARE);

  const { screenShare, isMute: amIScreenSharing } = useScreenShareState();
  const disableScreenShareButton = amIScreenSharing
    ? isSomeoneScreenSharing
    : false;
  return (
    <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
      <PermissionNotification
        permission={OwnCapability.SCREENSHARE}
        isAwaitingApproval={isAwaitingPermission}
        messageApproved={t('You can now share your screen.')}
        messageAwaitingApproval={t('Awaiting for an approval to share screen.')}
        messageRevoked={t('You can no longer share your screen.')}
      >
        <CompositeButton
          active={isSomeoneScreenSharing}
          caption={caption}
          title={caption || t('Share screen')}
          variant="primary"
          data-testid={
            isSomeoneScreenSharing
              ? 'screen-share-stop-button'
              : 'screen-share-start-button'
          }
          disabled={disableScreenShareButton}
          onClick={async () => {
            if (!hasPermission) {
              await requestPermission();
            } else {
              await screenShare.toggle();
            }
          }}
        >
          <Icon
            icon={
              isSomeoneScreenSharing ? 'screen-share-on' : 'screen-share-off'
            }
          />
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
