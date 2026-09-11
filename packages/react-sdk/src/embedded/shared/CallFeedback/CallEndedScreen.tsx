import { useI18n } from '../../../i18n';
import { Icon } from '../../../components';

interface CallEndedScreenProps {
  onJoin?: () => void;
  onFeedback: () => void;
}

export const CallEndedScreen = ({
  onJoin,
  onFeedback,
}: CallEndedScreenProps) => {
  const { t } = useI18n();

  return (
    <div className="str-video__embedded-call-feedback__container">
      <h2 className="str-video__embedded-call-feedback__title">
        {t('callFeedback.callEndedScreen.callEnded.title', 'Call ended')}
      </h2>
      <div className="str-video__embedded-call-feedback__ended-actions">
        {onJoin && (
          <>
            <div className="str-video__embedded-call-feedback__ended-column">
              <p className="str-video__embedded-call-feedback__ended-label">
                {t(
                  'callFeedback.callEndedScreen.leftByMistake.text',
                  'Left by mistake?',
                )}
              </p>
              <button
                type="button"
                className="str-video__embedded-call-feedback__ended-button"
                onClick={onJoin}
              >
                <Icon icon="login" />
                {t(
                  'callFeedback.callEndedScreen.rejoinCall.label',
                  'Rejoin call',
                )}
              </button>
            </div>
            <div className="str-video__embedded-call-feedback__ended-divider" />
          </>
        )}
        <div className="str-video__embedded-call-feedback__ended-column">
          <p className="str-video__embedded-call-feedback__ended-label">
            {t(
              'callFeedback.callEndedScreen.helpUsImprove.text',
              'Help us improve',
            )}
          </p>
          <button
            type="button"
            className="str-video__embedded-call-feedback__ended-button"
            onClick={onFeedback}
          >
            <Icon icon="feedback" />
            {t(
              'callFeedback.callEndedScreen.leaveFeedback.label',
              'Leave feedback',
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
