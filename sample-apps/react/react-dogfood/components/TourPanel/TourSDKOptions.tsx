import { Icon, useI18n } from '@stream-io/video-react-sdk';

export const TourSDKOptions = () => {
  const { t } = useI18n();
  return (
    <>
      <p className="rd__tour__explanation">
        To get more details
        <a
          className="rd__tour__link"
          href="https://getstream.io/video/#contact"
          target="_blank"
          rel="noreferrer"
        >
          contact an expert
        </a>
      </p>

      <div className="rd__sdk-options">
        <div className="rd__sdk-options__option">
          <Icon icon="layout-speaker-live-stream" /> {t('Livestreaming')}
        </div>
        <div className="rd__sdk-options__option">
          <Icon icon="mic" /> {t('Audio Rooms')}
        </div>
      </div>
    </>
  );
};
