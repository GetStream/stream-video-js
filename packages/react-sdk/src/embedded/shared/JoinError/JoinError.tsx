import { useI18n } from '@stream-io/video-react-bindings';
import { Button, Icon } from '../../../components';

interface JoinErrorProps {
  onJoin: () => void;
}

export const JoinError = ({ onJoin }: JoinErrorProps) => {
  const { t } = useI18n();

  return (
    <div className="str-video__embedded-join-error">
      <h2 className="str-video__embedded-join-error__title">
        {t('Failed to join the call')}
      </h2>
      <p className="str-video__embedded-join-error__message">
        {t(
          "We couldn't connect to the server. Please check your connection and try again.",
        )}
      </p>
      <Button size="sm" onClick={onJoin}>
        <Icon icon="login" />
        {t('Try again')}
      </Button>
    </div>
  );
};
