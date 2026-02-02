import { CallingState } from '@stream-io/video-client';
import { useI18n } from '@stream-io/video-react-bindings';
import { Icon, LoadingIndicator } from '../../../components';

export type ConnectionErrorScreenProps = {
  callingState: CallingState;
  onRetry: () => void;
};

export const ConnectionErrorScreen = ({
  callingState,
  onRetry,
}: ConnectionErrorScreenProps) => {
  const { t } = useI18n();

  if (callingState === CallingState.RECONNECTING) {
    return (
      <div className="str-video__embedded-connection-error">
        <div className="str-video__embedded-connection-error__content">
          <LoadingIndicator />
          <h2>{t('Reconnecting...')}</h2>
          <p>{t('Please wait while we restore your connection.')}</p>
        </div>
      </div>
    );
  }

  if (callingState === CallingState.OFFLINE) {
    return (
      <div className="str-video__embedded-connection-error">
        <div className="str-video__embedded-connection-error__content">
          <Icon
            icon="no-audio"
            className="str-video__embedded-connection-error__icon"
          />
          <h2>{t("You're offline")}</h2>
          <p>{t('Check your internet connection and try again.')}</p>
          <button
            className="str-video__embedded-button str-video__embedded-button--primary"
            onClick={onRetry}
          >
            {t('Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="str-video__embedded-connection-error">
      <div className="str-video__embedded-connection-error__content">
        <Icon
          icon="no-audio"
          className="str-video__embedded-connection-error__icon"
        />
        <h2>{t('Connection failed')}</h2>
        <p>{t("We couldn't reconnect to the stream. Please try again.")}</p>
        <button
          className="str-video__embedded-button str-video__embedded-button--primary"
          onClick={onRetry}
        >
          {t('Retry')}
        </button>
      </div>
    </div>
  );
};
