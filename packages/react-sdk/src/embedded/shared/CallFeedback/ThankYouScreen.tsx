import { useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../../../components';

export const ThankYouScreen = () => {
  const { t } = useI18n();
  return (
    <div className="str-video__embedded-call-feedback">
      <div className="str-video__embedded-call-feedback__container">
        <div className="str-video__embedded-call-feedback__checkmark">
          <Icon icon="checkmark" />
        </div>
        <h2 className="str-video__embedded-call-feedback__title">
          {t('Thank you!')}
        </h2>
        <p className="str-video__embedded-call-feedback__subtitle">
          {t('Your feedback helps improve call quality.')}
        </p>
      </div>
    </div>
  );
};
