import { useAppI18n } from '../../../hooks/useAppI18n';
import type {
  BattlecardEvent,
  BattlecardObjectionEvent,
  CrossSellEvent,
  ObjectionEvent,
  PlanFitEvent,
} from '../types';
import { CardFrame, Quote, SayThis } from './CardFrame';

type Dismiss = { onDismiss: () => void };

export const BattlecardCard = ({
  event,
  onDismiss,
}: Dismiss & { event: BattlecardEvent }) => {
  const { t } = useAppI18n();
  return (
    <CardFrame
      icon="⚔️"
      title={t('wwsd.card.battlecard', 'Stream vs {{ name }}', {
        name: event.name,
      })}
      onDismiss={onDismiss}
    >
      {(event.rows ?? []).map((row) => (
        <div key={row.axis} className="rd__wwsd-card__section">
          <p className="rd__wwsd-card__lead">
            {row.label}
            {row.generated && <span className="rd__wwsd-chip">AI-written</span>}
          </p>
          <p>
            <b>Stream:</b> {row.us}
          </p>
          <p>
            <b>{event.name}:</b> {row.them}
          </p>
          <SayThis text={row.say_this} />
          {row.caution && <p className="rd__wwsd-muted">⚠️ {row.caution}</p>}
        </div>
      ))}
      {(event.discovery ?? []).length > 0 && (
        <div className="rd__wwsd-card__section">
          <p className="rd__wwsd-card__lead">
            {t('wwsd.card.discovery', 'Ask them')}
          </p>
          <ul>
            {(event.discovery ?? []).map((q) => (
              <li key={q.question} title={q.why}>
                {q.question}
              </li>
            ))}
          </ul>
        </div>
      )}
      {event.source && <p className="rd__wwsd-muted">{event.source}</p>}
    </CardFrame>
  );
};

export const BattlecardObjectionCard = ({
  event,
  onDismiss,
}: Dismiss & { event: BattlecardObjectionEvent }) => {
  const { t } = useAppI18n();
  return (
    <CardFrame
      icon="🛡️"
      title={t('wwsd.card.battlecardObjection', 'Objection: {{ name }}', {
        name: event.name,
      })}
      onDismiss={onDismiss}
    >
      <p>
        <b>{t('wwsd.card.theySay', 'They say:')}</b> {event.they_say}
      </p>
      <SayThis text={event.you_say} label="You say:" />
      <Quote text={event.quote} />
    </CardFrame>
  );
};

export const ObjectionCard = ({
  event,
  onDismiss,
}: Dismiss & { event: ObjectionEvent }) => {
  const { t } = useAppI18n();
  return (
    <CardFrame
      icon="🧭"
      title={t('wwsd.card.objection', 'What worked before: {{ theme }}', {
        theme: event.theme,
      })}
      onDismiss={onDismiss}
    >
      {event.said && <p className="rd__wwsd-muted">“{event.said}”</p>}
      <SayThis text={event.what_worked} label="What worked:" />
      {event.outcome && <p>{event.outcome}</p>}
      <Quote text={event.quote} />
    </CardFrame>
  );
};

export const PlanFitCard = ({
  event,
  onDismiss,
}: Dismiss & { event: PlanFitEvent }) => {
  const { t } = useAppI18n();
  return (
    <CardFrame
      icon="💳"
      title={t('wwsd.card.planFit', 'Plan fit: {{ name }}', {
        name: event.name,
      })}
      onDismiss={onDismiss}
    >
      <p className="rd__wwsd-card__lead">
        {[event.tier, event.price].filter(Boolean).join(' · ')}
      </p>
      <SayThis text={event.say_this} />
      <Quote text={event.quote} />
    </CardFrame>
  );
};

export const CrossSellCard = ({
  event,
  onDismiss,
}: Dismiss & { event: CrossSellEvent }) => {
  const { t } = useAppI18n();
  return (
    <CardFrame
      icon="➕"
      title={t('wwsd.card.crossSell', 'Cross-sell: {{ name }}', {
        name: event.name,
      })}
      onDismiss={onDismiss}
    >
      <p>{event.why}</p>
      <SayThis text={event.say_this} />
      {event.docs && (
        <a href={event.docs} target="_blank" rel="noreferrer">
          {t('wwsd.card.docsLink', 'Docs')}
        </a>
      )}
    </CardFrame>
  );
};
