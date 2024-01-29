import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';

import { OwnCapability } from '@stream-io/video-client';
import { CompositeButton, IconButtonWithMenuProps } from '../Button/';
import { DeviceSelectorVideo } from '../DeviceSettings';
import { PermissionNotification } from '../Notification';
import { useRequestPermission } from '../../hooks';
import { Icon } from '../Icon';

export type ToggleVideoPreviewButtonProps = Pick<
  IconButtonWithMenuProps,
  'caption' | 'Menu' | 'menuPlacement'
>;

export const ToggleVideoPreviewButton = (
  props: ToggleVideoPreviewButtonProps,
) => {
  const { caption, ...restCompositeButtonProps } = props;
  const { t } = useI18n();
  const { useCameraState } = useCallStateHooks();
  const { camera, isMute, hasBrowserPermission } = useCameraState();

  return (
    <CompositeButton
      active={isMute}
      caption={caption}
      title={
        !hasBrowserPermission
          ? t('Check your browser video permissions')
          : caption || t('Video')
      }
      variant="secondary"
      data-testid={
        isMute ? 'preview-video-unmute-button' : 'preview-video-mute-button'
      }
      onClick={() => camera.toggle()}
      disabled={!hasBrowserPermission}
      {...restCompositeButtonProps}
    >
      <Icon icon={!isMute ? 'camera' : 'camera-off'} />
      {!hasBrowserPermission && (
        <span
          className="str-video__no-media-permission"
          title={t('Check your browser video permissions')}
          children="!"
        />
      )}
    </CompositeButton>
  );
};

type ToggleVideoPublishingButtonProps = Pick<
  IconButtonWithMenuProps,
  'caption' | 'Menu' | 'menuPlacement'
>;

export const ToggleVideoPublishingButton = (
  props: ToggleVideoPublishingButtonProps,
) => {
  const { t } = useI18n();
  const {
    caption,
    Menu = <DeviceSelectorVideo visualType="list" />,
    menuPlacement = 'top',
    ...restCompositeButtonProps
  } = props;

  const { hasPermission, requestPermission, isAwaitingPermission } =
    useRequestPermission(OwnCapability.SEND_VIDEO);

  const { useCameraState, useCallSettings } = useCallStateHooks();
  const { camera, isMute, hasBrowserPermission } = useCameraState();
  const callSettings = useCallSettings();
  const isPublishingVideoAllowed = callSettings?.video.enabled;

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <PermissionNotification
        permission={OwnCapability.SEND_VIDEO}
        isAwaitingApproval={isAwaitingPermission}
        messageApproved={t('You can now share your video.')}
        messageAwaitingApproval={t(
          'Awaiting for an approval to share your video.',
        )}
        messageRevoked={t('You can no longer share your video.')}
      >
        <CompositeButton
          active={isMute}
          caption={caption}
          variant="secondary"
          title={
            !hasPermission
              ? t('You have no permission to share your video')
              : !hasBrowserPermission
              ? t('Check your browser video permissions')
              : !isPublishingVideoAllowed
              ? t('Video publishing is disabled by the system')
              : caption || t('Video')
          }
          disabled={
            !hasBrowserPermission || !hasPermission || !isPublishingVideoAllowed
          }
          data-testid={isMute ? 'video-unmute-button' : 'video-mute-button'}
          onClick={async () => {
            if (!hasPermission) {
              await requestPermission();
            } else {
              await camera.toggle();
            }
          }}
          Menu={Menu}
          menuPlacement={menuPlacement}
          {...restCompositeButtonProps}
        >
          <Icon icon={isMute ? 'camera-off' : 'camera'} />
          {(!hasBrowserPermission ||
            !hasPermission ||
            !isPublishingVideoAllowed) && (
            <span className="str-video__no-media-permission">!</span>
          )}
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
