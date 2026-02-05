import { useI18n } from '@stream-io/video-react-bindings';
import { LoadingIndicator } from '../../components';

export type LoadingScreenProps = {
  /** Optional message to display below the spinner */
  message?: string;
};

/**
 * A full-screen loading indicator with optional message.
 * Used while initializing the client, call, or during transitions.
 */
export const LoadingScreen = ({ message }: LoadingScreenProps) => {
  const { t } = useI18n();

  return (
    <div className="str-video__call">
      <div className="str-video__call__loading-screen">
        <LoadingIndicator />
        {message && <p>{t(message)}</p>}
      </div>
    </div>
  );
};
