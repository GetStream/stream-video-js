import {
  Restricted,
  useCallStateHooks,
  UseInputMediaDeviceOptions,
} from '@stream-io/video-react-bindings';
import { useI18n } from '../../i18n';
import clsx from 'clsx';
import {
  OwnCapability,
  RequestPermissionRequestPermissionsEnum,
  SfuModels,
} from '@stream-io/video-client';
import { Badge } from '../Badge';
import { CompositeButton, CompositeButtonProps } from '../Button/';
import { DeviceSelectorVideo } from '../DeviceSettings';
import { PermissionNotification } from '../Notification';
import { useRequestPermission } from '../../hooks';
import { Icon } from '../Icon';
import { WithTooltip } from '../Tooltip';
import { useState } from 'react';
import {
  createCallControlHandler,
  PropsWithErrorHandler,
} from '../../utilities/callControlHandler';

export type ToggleVideoPreviewButtonProps = PropsWithErrorHandler<
  Pick<
    CompositeButtonProps,
    'caption' | 'Menu' | 'menuPlacement' | 'onMenuToggle'
  > &
    UseInputMediaDeviceOptions
>;

export const ToggleVideoPreviewButton = (
  props: ToggleVideoPreviewButtonProps,
) => {
  const {
    caption,
    Menu = DeviceSelectorVideo,
    menuPlacement = 'top',
    onMenuToggle,
    optimisticUpdates,
    ...restCompositeButtonProps
  } = props;
  const { t } = useI18n();
  const { useCameraState, useLocalParticipant } = useCallStateHooks();
  const {
    camera,
    hasBrowserPermission,
    isPromptingPermission,
    isTogglePending,
    optionsAwareIsMute,
  } = useCameraState({ optimisticUpdates });
  const localParticipant = useLocalParticipant();
  const isSystemMuted = !!localParticipant?.interruptedTracks?.includes(
    SfuModels.TrackType.VIDEO,
  );
  const [tooltipDisabled, setTooltipDisabled] = useState(false);
  const handleClick = createCallControlHandler(props, () => camera.toggle());

  return (
    <WithTooltip
      title={
        isPromptingPermission
          ? t('common.waitingForPermission.title', 'Waiting for permission')
          : !hasBrowserPermission
            ? t(
                'callControls.toggleVideoButton.checkBrowserVideoPermissions.title',
                'Check your browser video permissions',
              )
            : isSystemMuted
              ? t(
                  'callControls.toggleVideoButton.cameraPausedBySystem.title',
                  'Camera is paused by your system',
                )
              : (caption ??
                t('callControls.toggleVideoButton.video.title', 'Video'))
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
        data-testid={
          optionsAwareIsMute
            ? 'preview-video-unmute-button'
            : 'preview-video-mute-button'
        }
        onClick={handleClick}
        disabled={
          !hasBrowserPermission || (!optimisticUpdates && isTogglePending)
        }
        Menu={Menu}
        menuPlacement={menuPlacement}
        {...restCompositeButtonProps}
        onMenuToggle={(shown) => {
          setTooltipDisabled(shown);
          onMenuToggle?.(shown);
        }}
      >
        <Icon icon={!optionsAwareIsMute ? 'camera' : 'camera-off'} />
        {isPromptingPermission ? (
          <Badge variant="error" icon="question-mark-fill" />
        ) : !hasBrowserPermission || isSystemMuted ? (
          <Badge variant="error" icon="exclamation-mark-fill" />
        ) : null}
      </CompositeButton>
    </WithTooltip>
  );
};

type ToggleVideoPublishingButtonProps = PropsWithErrorHandler<
  Pick<
    CompositeButtonProps,
    'caption' | 'Menu' | 'menuPlacement' | 'onMenuToggle'
  > &
    UseInputMediaDeviceOptions
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
    optimisticUpdates,
    ...restCompositeButtonProps
  } = props;

  const { hasPermission, requestPermission, isAwaitingPermission } =
    useRequestPermission(RequestPermissionRequestPermissionsEnum.SEND_VIDEO);

  const { useCameraState, useCallSettings, useLocalParticipant } =
    useCallStateHooks();
  const {
    camera,
    optionsAwareIsMute,
    hasBrowserPermission,
    isPromptingPermission,
    isTogglePending,
  } = useCameraState({ optimisticUpdates });
  const localParticipant = useLocalParticipant();
  const isSystemMuted = !!localParticipant?.interruptedTracks?.includes(
    SfuModels.TrackType.VIDEO,
  );
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
        messageApproved={t(
          'callControls.toggleVideoButton.permissionGranted.text',
          'You can now share your video.',
        )}
        messageAwaitingApproval={t(
          'callControls.toggleVideoButton.awaitingApproval.text',
          'Awaiting for an approval to share your video.',
        )}
        messageRevoked={t(
          'callControls.toggleVideoButton.permissionRevoked.text',
          'You can no longer share your video.',
        )}
      >
        <WithTooltip
          title={
            isPromptingPermission
              ? t('common.waitingForPermission.title', 'Waiting for permission')
              : !hasPermission
                ? t(
                    'callControls.toggleVideoButton.noPermissionToShareVideo.title',
                    'You have no permission to share your video',
                  )
                : !hasBrowserPermission
                  ? t(
                      'callControls.toggleVideoButton.checkBrowserVideoPermissions.title',
                      'Check your browser video permissions',
                    )
                  : !isPublishingVideoAllowed
                    ? t(
                        'callControls.toggleVideoButton.videoPublishingDisabled.title',
                        'Video publishing is disabled by the system',
                      )
                    : isSystemMuted
                      ? t(
                          'callControls.toggleVideoButton.cameraPausedBySystem.title',
                          'Camera is paused by your system',
                        )
                      : caption ||
                        t('callControls.toggleVideoButton.video.title', 'Video')
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
              !isPublishingVideoAllowed ||
              (!optimisticUpdates && isTogglePending)
            }
            data-testid={
              optionsAwareIsMute ? 'video-unmute-button' : 'video-mute-button'
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
            <Icon icon={optionsAwareIsMute ? 'camera-off' : 'camera'} />
            {isPromptingPermission ? (
              <Badge variant="error" icon="question-mark-fill" />
            ) : !hasBrowserPermission ||
              !hasPermission ||
              !isPublishingVideoAllowed ||
              isSystemMuted ? (
              <Badge variant="error" icon="exclamation-mark-fill" />
            ) : null}
          </CompositeButton>
        </WithTooltip>
      </PermissionNotification>
    </Restricted>
  );
};
