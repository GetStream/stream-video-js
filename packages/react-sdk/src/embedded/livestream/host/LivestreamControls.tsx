import type { ReactNode } from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useI18n } from '@stream-io/video-react-bindings';
import {
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  MicCaptureErrorNotification,
  ReactionsButton,
  RecordCallConfirmationButton,
  ScreenShareButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from '../../../components';
import { LivestreamDuration } from './LivestreamDuration';
import { CameraMenuWithBlur } from '../../shared';

export type LivestreamControlsProps = {
  actionButton: ReactNode;
  trailingContent?: ReactNode;
};

export const LivestreamControls = ({
  actionButton,
  trailingContent,
}: LivestreamControlsProps) => {
  const { t } = useI18n();

  return (
    <div className="str-video__embedded-call-controls str-video__call-controls">
      <div className="str-video__call-controls--group str-video__call-controls--options">
        <LivestreamDuration />
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
        {actionButton}
      </div>
      <div className="str-video__call-controls--group str-video__call-controls--sidebar">
        {trailingContent}
      </div>
    </div>
  );
};
