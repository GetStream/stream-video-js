import { useI18n } from '../../../i18n';
import { Icon } from '../../../components';

export const ThankYouScreen = () => {
  const { t } = useI18n();
  return (
    <div className="str-video__embedded-call-feedback__container">
      <div className="str-video__embedded-call-feedback__checkmark">
        <Icon icon="checkmark" />
      </div>
      <h2 className="str-video__embedded-call-feedback__title">
        {t('callFeedback.thankYouScreen.thankYou.title', 'Thank you!')}
      </h2>
      <p className="str-video__embedded-call-feedback__subtitle">
        {t(
          'callFeedback.thankYouScreen.feedbackHelpsImprove.text',
          'Your feedback helps improve call quality.',
        )}
      </p>
    </div>
  );
};
