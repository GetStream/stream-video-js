import { ComponentType } from 'react';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';

import { OwnCapability } from '@stream-io/video-client';
import { CompositeButton, IconButton } from '../Button/';
import { DeviceSelectorVideo } from '../DeviceSettings';
import { PermissionNotification } from '../Notification';
import { useRequestPermission } from '../../hooks';

export type ToggleVideoPreviewButtonProps = {
  caption?: string;
  Menu?: ComponentType;
};

export const ToggleVideoPreviewButton = (
  props: ToggleVideoPreviewButtonProps,
) => {
  const { t } = useI18n();
  const { caption = t('Video'), Menu = DeviceSelectorVideo } = props;

  const { useCameraState } = useCallStateHooks();
  const { camera, isMute } = useCameraState();

  return (
    <CompositeButton Menu={Menu} active={isMute} caption={caption}>
      <IconButton
        icon={!isMute ? 'camera' : 'camera-off'}
        onClick={() => camera.toggle()}
      />
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
  const { caption = t('Video'), Menu = DeviceSelectorVideo } = props;

  const { hasPermission, requestPermission, isAwaitingPermission } =
    useRequestPermission(OwnCapability.SEND_VIDEO);

  const { useCameraState } = useCallStateHooks();
  const { camera, isMute } = useCameraState();

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
        <CompositeButton Menu={Menu} active={isMute} caption={caption}>
          <IconButton
            icon={isMute ? 'camera-off' : 'camera'}
            onClick={async () => {
              if (!hasPermission) {
                await requestPermission();
              } else {
                await camera.toggle();
              }
            }}
          />
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
