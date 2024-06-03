import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import clsx from 'clsx';
import { CompositeButton, IconButtonWithMenuProps } from '../Button';
import { DeviceSelectorAudioInput } from '../DeviceSettings';
import { PermissionNotification } from '../Notification';
import { useRequestPermission } from '../../hooks';
import { Icon } from '../Icon';
import { WithTooltip } from '../Tooltip';
import { useState } from 'react';
import {
  PropsWithErrorHandler,
  createCallControlHandler,
} from '../../utilities/callControlHandler';

export type ToggleAudioPreviewButtonProps = PropsWithErrorHandler<
  Pick<
    IconButtonWithMenuProps,
    'caption' | 'Menu' | 'menuPlacement' | 'onMenuToggle'
  >
>;

export const ToggleAudioPreviewButton = (
  props: ToggleAudioPreviewButtonProps,
) => {
  const { caption, Menu, menuPlacement, ...restCompositeButtonProps } = props;
  const { t } = useI18n();
  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, optimisticIsMute, hasBrowserPermission } =
    useMicrophoneState();
  const [tooltipDisabled, setTooltipDisabled] = useState(false);
  const handleClick = createCallControlHandler(props, () =>
    microphone.toggle(),
  );

  return (
    <WithTooltip
      title={
        !hasBrowserPermission
          ? t('Check your browser audio permissions')
          : caption ?? t('Mic')
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
        disabled={!hasBrowserPermission}
        data-testid={
          optimisticIsMute
            ? 'preview-audio-unmute-button'
            : 'preview-audio-mute-button'
        }
        onClick={handleClick}
        Menu={Menu}
        menuPlacement={menuPlacement}
        onMenuToggle={(shown) => setTooltipDisabled(shown)}
        {...restCompositeButtonProps}
      >
        <Icon icon={!optimisticIsMute ? 'mic' : 'mic-off'} />
        {!hasBrowserPermission && (
          <span
            className="str-video__no-media-permission"
            title={t('Check your browser audio permissions')}
            children="!"
          />
        )}
      </CompositeButton>
    </WithTooltip>
  );
};

export type ToggleAudioPublishingButtonProps = PropsWithErrorHandler<
  Pick<
    IconButtonWithMenuProps,
    'caption' | 'Menu' | 'menuPlacement' | 'onMenuToggle'
  >
>;

export const ToggleAudioPublishingButton = (
  props: ToggleAudioPublishingButtonProps,
) => {
  const { t } = useI18n();
  const {
    caption,
    Menu = <DeviceSelectorAudioInput visualType="list" />,
    menuPlacement = 'top',
    ...restCompositeButtonProps
  } = props;

  const { hasPermission, requestPermission, isAwaitingPermission } =
    useRequestPermission(OwnCapability.SEND_AUDIO);

  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, optimisticIsMute, hasBrowserPermission } =
    useMicrophoneState();
  const [tooltipDisabled, setTooltipDisabled] = useState(false);
  const handleClick = createCallControlHandler(props, async () => {
    if (!hasPermission) {
      await requestPermission();
    } else {
      await microphone.toggle();
    }
  });

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <PermissionNotification
        permission={OwnCapability.SEND_AUDIO}
        isAwaitingApproval={isAwaitingPermission}
        messageApproved={t('You can now speak.')}
        messageAwaitingApproval={t('Awaiting for an approval to speak.')}
        messageRevoked={t('You can no longer speak.')}
      >
        <WithTooltip
          title={
            !hasPermission
              ? t('You have no permission to share your audio')
              : !hasBrowserPermission
                ? t('Check your browser mic permissions')
                : caption ?? t('Mic')
          }
          tooltipDisabled={tooltipDisabled}
        >
          <CompositeButton
            active={optimisticIsMute}
            caption={caption}
            variant="secondary"
            disabled={!hasBrowserPermission || !hasPermission}
            data-testid={
              optimisticIsMute ? 'audio-unmute-button' : 'audio-mute-button'
            }
            onClick={handleClick}
            Menu={Menu}
            menuPlacement={menuPlacement}
            menuOffset={16}
            onMenuToggle={(shown) => setTooltipDisabled(shown)}
            {...restCompositeButtonProps}
          >
            <Icon icon={optimisticIsMute ? 'mic-off' : 'mic'} />
            {(!hasBrowserPermission || !hasPermission) && (
              <span className="str-video__no-media-permission">!</span>
            )}
          </CompositeButton>
        </WithTooltip>
      </PermissionNotification>
    </Restricted>
  );
};
