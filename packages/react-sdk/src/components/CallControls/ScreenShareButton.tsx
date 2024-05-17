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
import { WithTooltip } from '../Tooltip';
import {
  PropsWithErrorHandler,
  createCallControlHandler,
} from '../../utilities/callControlHandler';

export type ScreenShareButtonProps = PropsWithErrorHandler<{
  caption?: string;
}>;

export const ScreenShareButton = (props: ScreenShareButtonProps) => {
  const { t } = useI18n();
  const { caption } = props;

  const { useHasOngoingScreenShare, useScreenShareState, useCallSettings } =
    useCallStateHooks();
  const isSomeoneScreenSharing = useHasOngoingScreenShare();
  const { hasPermission, requestPermission, isAwaitingPermission } =
    useRequestPermission(OwnCapability.SCREENSHARE);

  const callSettings = useCallSettings();
  const isScreenSharingAllowed = callSettings?.screensharing.enabled;

  const { screenShare, optimisticIsMute } = useScreenShareState();
  const amIScreenSharing = !optimisticIsMute;
  const disableScreenShareButton =
    !amIScreenSharing &&
    (isSomeoneScreenSharing || isScreenSharingAllowed === false);
  const handleClick = createCallControlHandler(props, async () => {
    if (!hasPermission) {
      await requestPermission();
    } else {
      await screenShare.toggle();
    }
  });

  return (
    <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
      <PermissionNotification
        permission={OwnCapability.SCREENSHARE}
        isAwaitingApproval={isAwaitingPermission}
        messageApproved={t('You can now share your screen.')}
        messageAwaitingApproval={t('Awaiting for an approval to share screen.')}
        messageRevoked={t('You can no longer share your screen.')}
      >
        <WithTooltip title={caption ?? t('Share screen')}>
          <CompositeButton
            active={isSomeoneScreenSharing || amIScreenSharing}
            caption={caption}
            variant="primary"
            data-testid={
              isSomeoneScreenSharing
                ? 'screen-share-stop-button'
                : 'screen-share-start-button'
            }
            disabled={disableScreenShareButton}
            onClick={handleClick}
          >
            <Icon
              icon={
                isSomeoneScreenSharing ? 'screen-share-on' : 'screen-share-off'
              }
            />
          </CompositeButton>
        </WithTooltip>
      </PermissionNotification>
    </Restricted>
  );
};
