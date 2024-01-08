import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { CompositeButton, IconButtonWithMenuProps } from '../Button';
import { PermissionNotification } from '../Notification';
import { useRequestPermission } from '../../hooks';
import { Icon } from '../Icon';

export type ToggleAudioPreviewButtonProps = Pick<
  IconButtonWithMenuProps,
  'caption' | 'Menu' | 'menuPlacement'
>;

export const ToggleAudioPreviewButton = (
  props: ToggleAudioPreviewButtonProps,
) => {
  const { caption, ...restCompositeButtonProps } = props;
  const { t } = useI18n();
  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, isMute, hasBrowserPermission } = useMicrophoneState();

  return (
    <CompositeButton
      active={isMute}
      caption={caption}
      variant="secondary"
      title={
        !hasBrowserPermission
          ? t('Check your browser audio permissions')
          : caption || t('Mic')
      }
      disabled={!hasBrowserPermission}
      data-testid={
        isMute ? 'preview-audio-unmute-button' : 'preview-audio-mute-button'
      }
      onClick={() => microphone.toggle()}
      {...restCompositeButtonProps}
    >
      <Icon icon={!isMute ? 'mic' : 'mic-off'} />
      {!hasBrowserPermission && (
        <span
          className="str-video__no-media-permission"
          title={t('Check your browser audio permissions')}
          children="!"
        />
      )}
    </CompositeButton>
  );
};

export type ToggleAudioPublishingButtonProps = Pick<
  IconButtonWithMenuProps,
  'caption' | 'Menu' | 'menuPlacement'
>;

export const ToggleAudioPublishingButton = (
  props: ToggleAudioPublishingButtonProps,
) => {
  const { t } = useI18n();
  const { caption, ...restCompositeButtonProps } = props;

  const { hasPermission, requestPermission, isAwaitingPermission } =
    useRequestPermission(OwnCapability.SEND_AUDIO);

  const { useMicrophoneState } = useCallStateHooks();
  const { microphone, isMute, hasBrowserPermission } = useMicrophoneState();

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <PermissionNotification
        permission={OwnCapability.SEND_AUDIO}
        isAwaitingApproval={isAwaitingPermission}
        messageApproved={t('You can now speak.')}
        messageAwaitingApproval={t('Awaiting for an approval to speak.')}
        messageRevoked={t('You can no longer speak.')}
      >
        <CompositeButton
          active={isMute}
          caption={caption}
          title={
            !hasBrowserPermission || !hasPermission
              ? t('Check your browser mic permissions')
              : caption || t('Mic')
          }
          variant="secondary"
          disabled={!hasBrowserPermission || !hasPermission}
          data-testid={isMute ? 'audio-unmute-button' : 'audio-mute-button'}
          onClick={async () => {
            if (!hasPermission) {
              await requestPermission();
            } else {
              await microphone.toggle();
            }
          }}
          {...restCompositeButtonProps}
        >
          <Icon icon={isMute ? 'mic-off' : 'mic'} />
          {(!hasBrowserPermission || !hasPermission) && (
            <span className="str-video__no-media-permission">!</span>
          )}
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
