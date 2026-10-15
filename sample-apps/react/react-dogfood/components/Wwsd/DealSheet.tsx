import clsx from 'clsx';
import { useAppI18n } from '../../hooks/useAppI18n';
import { useWwsd } from './WwsdContext';

export const DealSheet = () => {
  const { t } = useAppI18n();
  const { state } = useWwsd();
  const sheet = state.dealSheet;
  const fields = sheet?.fields ?? [];
  if (!sheet || fields.length === 0) return null;
  const captured = new Set(sheet.captured ?? []);
  const known = fields.filter((field) => field.value || field.quote);
  const askNext = fields.find(
    (field) => !field.value && !field.quote && field.ask,
  );
  return (
    <details className="rd__wwsd-deal" open>
      <summary>
        {t('wwsd.deal.title', 'Deal sheet')} ({known.length}/{fields.length})
      </summary>
      {askNext && (
        <p className="rd__wwsd-say">
          <b>{t('wwsd.deal.askNext', 'Ask next:')}</b> {askNext.ask}
        </p>
      )}
      <dl>
        {known.map((field) => (
          <div
            key={`${field.signal}:${sheet.ts}`}
            className={clsx(
              'rd__wwsd-deal__field',
              captured.has(field.signal) && 'rd__wwsd-deal__field--captured',
            )}
            title={field.quote}
          >
            <dt>{field.label}</dt>
            <dd>{field.value || `“${field.quote}”`}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
};
