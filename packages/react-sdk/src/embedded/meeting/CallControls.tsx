import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useI18n } from '@stream-io/video-react-bindings';
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
 * Renders the in-call control bar: duration, media toggles, and sidebar toggle.
 * On small screens, reactions appear in the left group and duration/cancel move to the header.
 * On large screens, duration appears in the left group and reactions/cancel stay in the media group.
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
          <ScreenShareButton />
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
            onClick={onToggleParticipants}
          >
            <Icon icon="participants" />
          </CompositeButton>
        </WithTooltip>
      </div>
    </div>
  );
};
