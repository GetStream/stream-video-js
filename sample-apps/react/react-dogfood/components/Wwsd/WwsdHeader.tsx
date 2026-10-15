import { IconButton } from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useAppI18n } from '../../hooks/useAppI18n';
import { useWwsd } from './WwsdContext';

export const WwsdHeader = (props: {
  onClose: () => void;
  onRecap: () => void;
  share: ReactNode;
}) => {
  const { onClose, onRecap, share } = props;
  const { t } = useAppI18n();
  const { status, listenStatus, error, state, actions, isPending } = useWwsd();
  const notice = error
    ? { level: 'error', text: error }
    : state.notice
      ? { level: state.notice.level, text: state.notice.text }
      : null;

  return (
    <div className="rd__wwsd-header">
      <div className="rd__wwsd-header__row">
        <span
          className={clsx('rd__wwsd-dot', `rd__wwsd-dot--${status}`)}
          title={status}
        />
        <h2 className="rd__wwsd-header__title">
          {t('wwsd.panel.title', 'WWSD copilot')}
        </h2>
        <span className="rd__wwsd-header__listen">
          {listenStatus === 'listening' &&
            t('wwsd.listen.listening', 'Copilot listening 👂')}
          {listenStatus === 'joining' &&
            t('wwsd.listen.joining', 'Copilot joining...')}
          {listenStatus === 'failed' && (
            <>
              {t('wwsd.listen.failed', "Copilot couldn't join")}{' '}
              <button
                className="rd__wwsd-link-button"
                disabled={isPending('listen')}
                onClick={() => {
                  actions
                    .retryListen()
                    .catch((err) =>
                      console.warn('[wwsd] listen retry failed', err),
                    );
                }}
              >
                {t('wwsd.listen.retry', 'Retry')}
              </button>
            </>
          )}
        </span>
        <IconButton
          onClick={onClose}
          size="sm"
          variant="secondary"
          appearance="ghost"
          icon="close"
        />
      </div>
      <div className="rd__wwsd-header__row">
        {share}
        <button
          className="rd__button rd__button--secondary"
          disabled={isPending('recap')}
          onClick={onRecap}
        >
          {t('wwsd.recap.button', 'End call & recap')}
        </button>
      </div>
      {notice && (
        <p
          className={clsx(
            'rd__wwsd-notice',
            `rd__wwsd-notice--${notice.level}`,
          )}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
};
