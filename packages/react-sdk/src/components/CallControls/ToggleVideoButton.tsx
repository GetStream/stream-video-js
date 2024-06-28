import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import clsx from 'clsx';
import { OwnCapability } from '@stream-io/video-client';
import { CompositeButton, IconButtonWithMenuProps } from '../Button/';
import { DeviceSelectorVideo } from '../DeviceSettings';
import { PermissionNotification } from '../Notification';
import { useRequestPermission } from '../../hooks';
import { Icon } from '../Icon';
import { WithTooltip } from '../Tooltip';
import { useState } from 'react';
import {
  PropsWithErrorHandler,
  createCallControlHandler,
} from '../../utilities/callControlHandler';

export type ToggleVideoPreviewButtonProps = PropsWithErrorHandler<
  Pick<
    IconButtonWithMenuProps,
    'caption' | 'Menu' | 'menuPlacement' | 'onMenuToggle'
  >
>;

export const ToggleVideoPreviewButton = (
  props: ToggleVideoPreviewButtonProps,
) => {
  const {
    caption,
    Menu = DeviceSelectorVideo,
    menuPlacement = 'top',
    onMenuToggle,
    ...restCompositeButtonProps
  } = props;
  const { t } = useI18n();
  const { useCameraState } = useCallStateHooks();
  const { camera, optimisticIsMute, hasBrowserPermission } = useCameraState();
  const [tooltipDisabled, setTooltipDisabled] = useState(false);
  const handleClick = createCallControlHandler(props, () => camera.toggle());

  return (
    <WithTooltip
      title={
        !hasBrowserPermission
          ? t('Check your browser video permissions')
          : caption ?? t('Video')
      }
      tooltipDisabled={tooltipDisabled}
    >
      <CompositeButton
        active={optimisticIsMute}
        caption={caption}
        className={clsx(
          !hasBrowserPermission && 'str-video__device-unavailable',
        )}
        variant="secondary"
        data-testid={
          optimisticIsMute
            ? 'preview-video-unmute-button'
            : 'preview-video-mute-button'
        }
        onClick={handleClick}
        disabled={!hasBrowserPermission}
        Menu={Menu}
        menuPlacement={menuPlacement}
        {...restCompositeButtonProps}
        onMenuToggle={(shown) => {
          setTooltipDisabled(shown);
          onMenuToggle?.(shown);
        }}
      >
        <Icon icon={!optimisticIsMute ? 'camera' : 'camera-off'} />
        {!hasBrowserPermission && (
          <span
            className="str-video__no-media-permission"
            title={t('Check your browser video permissions')}
            children="!"
          />
        )}
      </CompositeButton>
    </WithTooltip>
  );
};

type ToggleVideoPublishingButtonProps = PropsWithErrorHandler<
  Pick<
    IconButtonWithMenuProps,
    'caption' | 'Menu' | 'menuPlacement' | 'onMenuToggle'
  >
>;

export const ToggleVideoPublishingButton = (
  props: ToggleVideoPublishingButtonProps,
) => {
  const { t } = useI18n();
  const {
    caption,
    Menu = <DeviceSelectorVideo visualType="list" />,
    menuPlacement = 'top',
    onMenuToggle,
    ...restCompositeButtonProps
  } = props;

  const { hasPermission, requestPermission, isAwaitingPermission } =
    useRequestPermission(OwnCapability.SEND_VIDEO);

  const { useCameraState, useCallSettings } = useCallStateHooks();
  const { camera, optimisticIsMute, hasBrowserPermission } = useCameraState();
  const callSettings = useCallSettings();
  const isPublishingVideoAllowed = callSettings?.video.enabled;
  const [tooltipDisabled, setTooltipDisabled] = useState(false);
  const handleClick = createCallControlHandler(props, async () => {
    if (!hasPermission) {
      await requestPermission();
    } else {
      await camera.toggle();
    }
  });

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
        <WithTooltip
          title={
            !hasPermission
              ? t('You have no permission to share your video')
              : !hasBrowserPermission
                ? t('Check your browser video permissions')
                : !isPublishingVideoAllowed
                  ? t('Video publishing is disabled by the system')
                  : caption || t('Video')
          }
          tooltipDisabled={tooltipDisabled}
        >
          <CompositeButton
            active={optimisticIsMute}
            caption={caption}
            variant="secondary"
            disabled={
              !hasBrowserPermission ||
              !hasPermission ||
              !isPublishingVideoAllowed
            }
            data-testid={
              optimisticIsMute ? 'video-unmute-button' : 'video-mute-button'
            }
            onClick={handleClick}
            Menu={Menu}
            menuPlacement={menuPlacement}
            menuOffset={16}
            {...restCompositeButtonProps}
            onMenuToggle={(shown) => {
              setTooltipDisabled(shown);
              onMenuToggle?.(shown);
            }}
          >
            <Icon icon={optimisticIsMute ? 'camera-off' : 'camera'} />
            {(!hasBrowserPermission ||
              !hasPermission ||
              !isPublishingVideoAllowed) && (
              <span className="str-video__no-media-permission">!</span>
            )}
          </CompositeButton>
        </WithTooltip>
      </PermissionNotification>
    </Restricted>
  );
};
