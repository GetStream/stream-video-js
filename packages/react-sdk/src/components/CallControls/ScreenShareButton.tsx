import {
  OwnCapability,
  RequestPermissionRequestPermissionsEnum,
} from '@stream-io/video-client';
import {
  Restricted,
  useCallStateHooks,
  UseInputMediaDeviceOptions,
} from '@stream-io/video-react-bindings';
import { useI18n } from '../../i18n';
import { CompositeButton } from '../Button/';
import { PermissionNotification } from '../Notification';
import { useRequestPermission } from '../../hooks';
import { Icon } from '../Icon';
import { WithTooltip } from '../Tooltip';
import {
  PropsWithErrorHandler,
  createCallControlHandler,
} from '../../utilities/callControlHandler';

export type ScreenShareButtonProps = PropsWithErrorHandler<
  {
    caption?: string;
  } & UseInputMediaDeviceOptions
>;

export const ScreenShareButton = (props: ScreenShareButtonProps) => {
  const { t } = useI18n();
  const { caption, optimisticUpdates } = props;

  const { useHasOngoingScreenShare, useScreenShareState, useCallSettings } =
    useCallStateHooks();
  const isSomeoneScreenSharing = useHasOngoingScreenShare();
  const { hasPermission, requestPermission, isAwaitingPermission } =
    useRequestPermission(RequestPermissionRequestPermissionsEnum.SCREENSHARE);

  const callSettings = useCallSettings();
  const isScreenSharingAllowed = callSettings?.screensharing.enabled;

  const { screenShare, optionsAwareIsMute, isTogglePending } =
    useScreenShareState({
      optimisticUpdates,
    });
  const amIScreenSharing = !optionsAwareIsMute;
  const disableScreenShareButton =
    (!amIScreenSharing &&
      (isSomeoneScreenSharing || isScreenSharingAllowed === false)) ||
    (!optimisticUpdates && isTogglePending);
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
        messageApproved={t(
          'callControls.screenShareButton.permissionGranted.text',
          'You can now share your screen.',
        )}
        messageAwaitingApproval={t(
          'callControls.screenShareButton.awaitingApproval.text',
          'Awaiting for an approval to share screen.',
        )}
        messageRevoked={t(
          'callControls.screenShareButton.permissionRevoked.text',
          'You can no longer share your screen.',
        )}
      >
        <WithTooltip
          title={
            caption ??
            t(
              'callControls.screenShareButton.shareScreen.title',
              'Share screen',
            )
          }
        >
          <CompositeButton
            active={isSomeoneScreenSharing || amIScreenSharing}
            caption={caption}
            variant={
              isSomeoneScreenSharing || amIScreenSharing
                ? 'primary'
                : 'secondary'
            }
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
