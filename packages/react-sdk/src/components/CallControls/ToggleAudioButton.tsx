import {
  OwnCapability,
  RequestPermissionRequestPermissionsEnum,
  SfuModels,
} from '@stream-io/video-client';
import {
  Restricted,
  useCallStateHooks,
  type UseInputMediaDeviceOptions,
} from '@stream-io/video-react-bindings';
import { useI18n } from '../../i18n';
import clsx from 'clsx';
import { Badge } from '../Badge';
import { CompositeButton, CompositeButtonProps } from '../Button';
import { DeviceSelectorAudioInput } from '../DeviceSettings';
import { PermissionNotification } from '../Notification';
import { useRequestPermission } from '../../hooks';
import { Icon } from '../Icon';
import { WithTooltip } from '../Tooltip';
import { useState } from 'react';
import {
  createCallControlHandler,
  PropsWithErrorHandler,
} from '../../utilities/callControlHandler';

export type ToggleAudioPreviewButtonProps = PropsWithErrorHandler<
  Pick<
    CompositeButtonProps,
    'caption' | 'Menu' | 'menuPlacement' | 'onMenuToggle'
  > &
    UseInputMediaDeviceOptions
>;

export const ToggleAudioPreviewButton = (
  props: ToggleAudioPreviewButtonProps,
) => {
  const {
    caption,
    Menu = DeviceSelectorAudioInput,
    menuPlacement = 'top',
    onMenuToggle,
    optimisticUpdates,
    ...restCompositeButtonProps
  } = props;
  const { t } = useI18n();
  const { useMicrophoneState, useLocalParticipant } = useCallStateHooks();
  const {
    microphone,
    hasBrowserPermission,
    isPromptingPermission,
    optionsAwareIsMute,
    isTogglePending,
  } = useMicrophoneState({ optimisticUpdates });
  const localParticipant = useLocalParticipant();
  const isSystemMuted = !!localParticipant?.interruptedTracks?.includes(
    SfuModels.TrackType.AUDIO,
  );
  const [tooltipDisabled, setTooltipDisabled] = useState(false);
  const handleClick = createCallControlHandler(props, () =>
    microphone.toggle(),
  );

  return (
    <WithTooltip
      title={
        isPromptingPermission
          ? t('common.waitingForPermission.title', 'Waiting for permission')
          : !hasBrowserPermission
            ? t(
                'callControls.toggleAudioButton.checkBrowserAudioPermissions.title',
                'Check your browser audio permissions',
              )
            : isSystemMuted
              ? t(
                  'callControls.toggleAudioButton.microphonePausedBySystem.title',
                  'Microphone is paused by your system',
                )
              : (caption ??
                t('callControls.toggleAudioButton.mic.title', 'Mic'))
      }
      tooltipDisabled={tooltipDisabled}
    >
      <CompositeButton
        active={optionsAwareIsMute}
        caption={caption}
        className={clsx(
          !hasBrowserPermission && 'str-video__device-unavailable',
        )}
        variant={optionsAwareIsMute ? 'destructive' : 'secondary'}
        disabled={
          !hasBrowserPermission || (!optimisticUpdates && isTogglePending)
        }
        data-testid={
          optionsAwareIsMute
            ? 'preview-audio-unmute-button'
            : 'preview-audio-mute-button'
        }
        onClick={handleClick}
        Menu={Menu}
        menuPlacement={menuPlacement}
        {...restCompositeButtonProps}
        onMenuToggle={(shown) => {
          setTooltipDisabled(shown);
          onMenuToggle?.(shown);
        }}
      >
        <Icon icon={!optionsAwareIsMute ? 'mic' : 'mic-off'} />
        {isPromptingPermission ? (
          <Badge variant="error" icon="question-mark-fill" />
        ) : !hasBrowserPermission || isSystemMuted ? (
          <Badge variant="error" icon="exclamation-mark-fill" />
        ) : null}
      </CompositeButton>
    </WithTooltip>
  );
};

export type ToggleAudioPublishingButtonProps = PropsWithErrorHandler<
  Pick<
    CompositeButtonProps,
    'caption' | 'Menu' | 'menuPlacement' | 'onMenuToggle'
  > &
    UseInputMediaDeviceOptions
>;

export const ToggleAudioPublishingButton = (
  props: ToggleAudioPublishingButtonProps,
) => {
  const { t } = useI18n();
  const {
    caption,
    Menu = <DeviceSelectorAudioInput visualType="list" />,
    menuPlacement = 'top',
    onMenuToggle,
    optimisticUpdates,
    ...restCompositeButtonProps
  } = props;

  const { hasPermission, requestPermission, isAwaitingPermission } =
    useRequestPermission(RequestPermissionRequestPermissionsEnum.SEND_AUDIO);

  const { useMicrophoneState, useLocalParticipant } = useCallStateHooks();
  const {
    microphone,
    hasBrowserPermission,
    isPromptingPermission,
    isTogglePending,
    optionsAwareIsMute,
  } = useMicrophoneState({ optimisticUpdates });
  const localParticipant = useLocalParticipant();
  const isSystemMuted = !!localParticipant?.interruptedTracks?.includes(
    SfuModels.TrackType.AUDIO,
  );

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
        messageApproved={t(
          'callControls.toggleAudioButton.permissionGranted.text',
          'You can now speak.',
        )}
        messageAwaitingApproval={t(
          'callControls.toggleAudioButton.awaitingApproval.text',
          'Awaiting for an approval to speak.',
        )}
        messageRevoked={t(
          'callControls.toggleAudioButton.permissionRevoked.text',
          'You can no longer speak.',
        )}
      >
        <WithTooltip
          title={
            isPromptingPermission
              ? t('common.waitingForPermission.title', 'Waiting for permission')
              : !hasPermission
                ? t(
                    'callControls.toggleAudioButton.noPermissionToShareAudio.title',
                    'You have no permission to share your audio',
                  )
                : !hasBrowserPermission
                  ? t(
                      'callControls.toggleAudioButton.checkBrowserMicPermissions.title',
                      'Check your browser mic permissions',
                    )
                  : isSystemMuted
                    ? t(
                        'callControls.toggleAudioButton.microphonePausedBySystem.title',
                        'Microphone is paused by your system',
                      )
                    : (caption ??
                      t('callControls.toggleAudioButton.mic.title', 'Mic'))
          }
          tooltipDisabled={tooltipDisabled}
        >
          <CompositeButton
            active={optionsAwareIsMute}
            caption={caption}
            variant={optionsAwareIsMute ? 'destructive' : 'secondary'}
            disabled={
              !hasBrowserPermission ||
              !hasPermission ||
              // disable button while the toggle action is pending when not using optimistic updates
              (!optimisticUpdates && isTogglePending)
            }
            data-testid={
              optionsAwareIsMute ? 'audio-unmute-button' : 'audio-mute-button'
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
            <Icon icon={optionsAwareIsMute ? 'mic-off' : 'mic'} />
            {isPromptingPermission ? (
              <Badge variant="error" icon="question-mark-fill" />
            ) : !hasBrowserPermission || !hasPermission || isSystemMuted ? (
              <Badge variant="error" icon="exclamation-mark-fill" />
            ) : null}
          </CompositeButton>
        </WithTooltip>
      </PermissionNotification>
    </Restricted>
  );
};
