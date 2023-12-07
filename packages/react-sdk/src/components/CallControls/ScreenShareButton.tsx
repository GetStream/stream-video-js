import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { CompositeButton, IconButton } from '../Button/';
import { PermissionNotification } from '../Notification';
import { useRequestPermission } from '../../hooks';

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
          activeVariant="primary"
        >
          <IconButton
            icon={
              isSomeoneScreenSharing ? 'screen-share-on' : 'screen-share-off'
            }
            data-testid={
              isSomeoneScreenSharing
                ? 'screen-share-stop-button'
                : 'screen-share-start-button'
            }
            title={caption || t('Share screen')}
            disabled={disableScreenShareButton}
            onClick={async () => {
              if (!hasPermission) {
                await requestPermission();
              } else {
                await screenShare.toggle();
              }
            }}
          />
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
