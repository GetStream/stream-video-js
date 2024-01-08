import { useI18n, Icon } from '@stream-io/video-react-sdk';

export const TourSDKOptions = () => {
  const { t } = useI18n();
  return (
    <>
      <p className="rd__tour__explanation">
        {t('To get more details')}
        <a href="#" className="rd__tour__link">
          {t('contact an expert')}
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
