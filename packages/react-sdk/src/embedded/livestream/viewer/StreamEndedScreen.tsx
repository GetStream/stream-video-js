import { useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../../../components';

export const StreamEndedScreen = () => {
  const { t } = useI18n();
  return (
    <div className="str-video__embedded-stream-ended">
      <div className="str-video__embedded-stream-ended__content">
        <Icon
          icon="call-end"
          className="str-video__embedded-stream-ended__icon"
        />
        <h2>{t('Stream ended')}</h2>
        <p>{t('The livestream has ended. Thank you for watching!')}</p>
      </div>
    </div>
  );
};
