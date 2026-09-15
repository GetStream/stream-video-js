import { useI18n } from '../../../i18n';
import { Button, Icon } from '../../../components';

interface JoinErrorProps {
  onJoin: () => void;
}

export const JoinError = ({ onJoin }: JoinErrorProps) => {
  const { t } = useI18n();

  return (
    <div className="str-video__embedded-join-error">
      <h2 className="str-video__embedded-join-error__title">
        {t('joinError.failedToJoin.title', 'Failed to join the call')}
      </h2>
      <p className="str-video__embedded-join-error__message">
        {t(
          'joinError.couldNotConnect.text',
          "We couldn't connect to the server. Please check your connection and try again.",
        )}
      </p>
      <Button size="sm" onClick={onJoin}>
        <Icon icon="login" />
        {t('common.tryAgain.label', 'Try again')}
      </Button>
    </div>
  );
};
