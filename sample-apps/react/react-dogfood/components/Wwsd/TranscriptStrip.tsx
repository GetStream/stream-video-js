import clsx from 'clsx';
import { useAppI18n } from '../../hooks/useAppI18n';
import { useWwsd } from './WwsdContext';

export const TranscriptStrip = () => {
  const { t } = useAppI18n();
  const { state } = useWwsd();
  const lines = state.transcript.slice(-3);
  return (
    <div className="rd__wwsd-transcript">
      {lines.length === 0 && (
        <p className="rd__wwsd-transcript__empty">
          {t('wwsd.transcript.empty', 'Waiting for the conversation...')}
        </p>
      )}
      {lines.map((line) => (
        <p
          key={`${line.speaker}:${line.ts}`}
          className={clsx(
            'rd__wwsd-transcript__line',
            !line.final && 'rd__wwsd-transcript__line--partial',
          )}
        >
          <b>
            {line.speaker === 'rep'
              ? t('wwsd.transcript.rep', 'Rep')
              : t('wwsd.transcript.customer', 'Customer')}
          </b>{' '}
          {line.text}
        </p>
      ))}
    </div>
  );
};
