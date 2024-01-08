import { ComponentType } from 'react';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';

import { OwnCapability } from '@stream-io/video-client';
import { CompositeButton, IconButton } from '../Button/';
import { PermissionNotification } from '../Notification';
import { useRequestPermission } from '../../hooks';

export type ToggleVideoPreviewButtonProps = {
  caption?: string;
  Menu?: ComponentType;
};

export const ToggleVideoPreviewButton = (
  props: ToggleVideoPreviewButtonProps,
) => {
  const { caption, Menu } = props;
  const { t } = useI18n();
  const { useCameraState } = useCallStateHooks();
  const { camera, isMute, hasBrowserPermission } = useCameraState();

  return (
    <CompositeButton
      Menu={Menu}
      active={isMute}
      caption={caption}
      title={
        !hasBrowserPermission
          ? t('Check your browser video permissions')
          : caption || t('Video')
      }
      variant="secondary"
    >
      <IconButton
        icon={!isMute ? 'camera' : 'camera-off'}
        data-testid={
          isMute ? 'preview-video-unmute-button' : 'preview-video-mute-button'
        }
        onClick={() => camera.toggle()}
        disabled={!hasBrowserPermission}
      />
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

type ToggleVideoPublishingButtonProps = {
  caption?: string;
  Menu?: ComponentType;
};

export const ToggleVideoPublishingButton = (
  props: ToggleVideoPublishingButtonProps,
) => {
  const { t } = useI18n();
  const { caption, Menu } = props;

  const { hasPermission, requestPermission, isAwaitingPermission } =
    useRequestPermission(OwnCapability.SEND_VIDEO);

  const { useCameraState } = useCallStateHooks();
  const { camera, isMute, hasBrowserPermission } = useCameraState();

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
          Menu={Menu}
          active={isMute}
          caption={caption}
          variant="secondary"
        >
          <IconButton
            icon={isMute ? 'camera-off' : 'camera'}
            title={
              !hasBrowserPermission || !hasPermission
                ? t('Check your browser video permissions')
                : caption || t('Video')
            }
            disabled={!hasBrowserPermission || !hasPermission}
            data-testid={isMute ? 'video-unmute-button' : 'video-mute-button'}
            onClick={async () => {
              if (!hasPermission) {
                await requestPermission();
              } else {
                await camera.toggle();
              }
            }}
          />
          {!hasBrowserPermission && (
            <span className="str-video__no-media-permission">!</span>
          )}
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
