import { useI18n } from '@stream-io/video-react-bindings';
import { PaginatedGridLayout } from '../../../core';
import { Icon, WithTooltip } from '../../../components';
import { LivestreamControls } from './LivestreamControls';

export type HostViewProps = {
  isLive: boolean;
  onGoLive: () => void;
  onStopLive: () => void;
};

export const HostView = ({ isLive, onGoLive, onStopLive }: HostViewProps) => {
  const { t } = useI18n();

  return (
    <div className="str-video__embedded-call str-video__embedded-livestream">
      <div className="str-video__embedded-main-panel">
        <div className="str-video__embedded-layout">
          <div className="str-video__embedded-layout__stage">
            <PaginatedGridLayout />
          </div>
        </div>
        <LivestreamControls
          actionButton={
            isLive ? (
              <WithTooltip title={t('End Stream')}>
                <button
                  className="str-video__composite-button str-video__composite-button--danger"
                  onClick={onStopLive}
                >
                  <Icon icon="call-end" />
                  <span>{t('End Stream')}</span>
                </button>
              </WithTooltip>
            ) : (
              <WithTooltip title={t('Start Stream')}>
                <button
                  className="str-video__composite-button str-video__composite-button--go-live"
                  onClick={onGoLive}
                >
                  <span>{t('Go Live')}</span>
                </button>
              </WithTooltip>
            )
          }
        />
      </div>
    </div>
  );
};
