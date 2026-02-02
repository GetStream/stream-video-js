import { OwnCapability } from '@stream-io/video-client';
import { Restricted, useI18n } from '@stream-io/video-react-bindings';
import { PaginatedGridLayout } from '../../../core';
import {
  CancelCallButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from '../../../components';

export type HostLiveControlsProps = {
  onGoLive: () => void;
  onLeave: () => void;
};

export const HostLiveControls = ({
  onGoLive,
  onLeave,
}: HostLiveControlsProps) => {
  const { t } = useI18n();
  return (
    <div className="str-video__embedded-call str-video__embedded-backstage-live">
      <div className="str-video__embedded-main-panel">
        <div className="str-video__embedded-backstage-header">
          <h2>{t('Backstage')}</h2>
          <span className="str-video__embedded-badge str-video__embedded-badge--waiting">
            {t('Not Live')}
          </span>
        </div>
        <div className="str-video__embedded-layout">
          <div className="str-video__embedded-layout__stage">
            <PaginatedGridLayout />
          </div>
        </div>
        <div className="str-video__embedded-call-controls str-video__call-controls">
          <div className="str-video__call-controls--group">
            <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
              <ToggleAudioPublishingButton />
            </Restricted>
            <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
              <ToggleVideoPublishingButton />
            </Restricted>
          </div>
          <div className="str-video__call-controls--group">
            <button
              className="str-video__embedded-button str-video__embedded-button--go-live"
              onClick={onGoLive}
            >
              {t('Go Live')}
            </button>
          </div>
          <div className="str-video__call-controls--group">
            <CancelCallButton onLeave={onLeave} />
          </div>
        </div>
      </div>
    </div>
  );
};
