import { OwnCapability } from '@stream-io/video-client';
import {
  Restricted,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import {
  CancelCallConfirmButton,
  CompositeButton,
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  Icon,
  MicCaptureErrorNotification,
  ReactionsButton,
  RecordCallConfirmationButton,
  ScreenShareButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  WithTooltip,
} from '../../components';

import { useCallDuration } from '../hooks';
import { CameraMenuWithBlur } from '../shared';

interface CallControlsProps {
  showParticipants: boolean;
  onToggleParticipants: () => void;
}

/**
 * Renders the active call control bar
 */
export const CallControls = ({
  showParticipants,
  onToggleParticipants,
}: CallControlsProps) => {
  const { t } = useI18n();
  const { useCallSession } = useCallStateHooks();
  const session = useCallSession();
  const startedAt = session?.started_at;
  const { elapsed } = useCallDuration(startedAt);

  return (
    <div className="str-video__embedded-call-controls str-video__call-controls">
      <div className="str-video__call-controls--group str-video__call-controls--options">
        <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
          <div className="str-video__embedded-mobile">
            <ReactionsButton />
          </div>
        </Restricted>
        {startedAt && (
          <div className="str-video__embedded-call-duration str-video__embedded-desktop">
            <Icon
              icon="verified"
              className="str-video__embedded-call-duration__icon"
            />
            <span className="str-video__embedded-call-duration__time">
              {elapsed}
            </span>
          </div>
        )}
      </div>
      <div className="str-video__call-controls--group str-video__call-controls--media">
        <Restricted
          requiredGrants={[OwnCapability.SEND_AUDIO]}
          hasPermissionsOnly
        >
          <MicCaptureErrorNotification>
            <ToggleAudioPublishingButton
              Menu={
                <>
                  <DeviceSelectorAudioInput
                    visualType="list"
                    title={t('Microphone')}
                  />
                  <DeviceSelectorAudioOutput
                    visualType="list"
                    title={t('Speaker')}
                  />
                </>
              }
              menuPlacement="top"
            />
          </MicCaptureErrorNotification>
        </Restricted>
        <Restricted
          requiredGrants={[OwnCapability.SEND_VIDEO]}
          hasPermissionsOnly
        >
          <ToggleVideoPublishingButton
            Menu={<CameraMenuWithBlur />}
            menuPlacement="top"
          />
        </Restricted>
        <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
          <div className="str-video__embedded-desktop">
            <ReactionsButton />
          </div>
        </Restricted>
        <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
          <div className="str-video__embedded-desktop">
            <ScreenShareButton />
          </div>
        </Restricted>
        <RecordCallConfirmationButton />
        <div className="str-video__embedded-desktop">
          <CancelCallConfirmButton />
        </div>
      </div>
      <div className="str-video__call-controls--group str-video__call-controls--sidebar">
        <WithTooltip title={t('Participants')}>
          <CompositeButton
            active={showParticipants}
            aria-label={t('Participants')}
            aria-pressed={showParticipants}
            onClick={onToggleParticipants}
          >
            <Icon icon="participants" />
          </CompositeButton>
        </WithTooltip>
      </div>
    </div>
  );
};
