import { useI18n } from '@stream-io/video-react-bindings';
import { Icon } from '../../../components';

export const ViewerWaiting = () => {
  const { t } = useI18n();
  return (
    <div className="str-video__embedded-call str-video__embedded-viewer-waiting">
      <div className="str-video__embedded-waiting-screen">
        <Icon icon="notification" />
        <h2>{t('Waiting for stream to start')}</h2>
        <p>{t('The host will start the livestream soon.')}</p>
      </div>
    </div>
  );
};
