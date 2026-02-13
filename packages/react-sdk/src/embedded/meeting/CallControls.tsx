import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useI18n } from '@stream-io/video-react-bindings';
import {
  CancelCallButton,
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
 * Renders the in-call control bar: duration, media toggles, and sidebar toggle.
 */
export const CallControls = ({
  showParticipants,
  onToggleParticipants,
}: CallControlsProps) => {
  const { t } = useI18n();
  const { startedAt, elapsed } = useCallDuration();

  return (
    <div className="str-video__embedded-call-controls str-video__call-controls">
      <div className="str-video__call-controls--group str-video__call-controls--options">
        {startedAt && (
          <div className="str-video__embedded-call-duration">
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
                  <DeviceSelectorAudioOutput
                    visualType="list"
                    title={t('Speaker')}
                  />
                  <DeviceSelectorAudioInput
                    visualType="list"
                    title={t('Microphone')}
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
          <div className="str-video__embedded-dual-toggle">
            <ToggleVideoPublishingButton
              Menu={<CameraMenuWithBlur />}
              menuPlacement="top"
            />
          </div>
        </Restricted>
        <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
          <ReactionsButton />
        </Restricted>
        <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
          <ScreenShareButton />
        </Restricted>
        <RecordCallConfirmationButton />
        <CancelCallButton />
      </div>
      <div className="str-video__call-controls--group str-video__call-controls--sidebar">
        <WithTooltip title={t('Participants')}>
          <CompositeButton
            active={showParticipants}
            onClick={onToggleParticipants}
          >
            <Icon icon="participants" />
          </CompositeButton>
        </WithTooltip>
      </div>
    </div>
  );
};
