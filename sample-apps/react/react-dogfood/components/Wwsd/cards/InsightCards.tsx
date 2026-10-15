import { useAppI18n } from '../../../hooks/useAppI18n';
import type {
  DocsSuggestionEvent,
  IssueDetectedEvent,
  PersonaInsightEvent,
} from '../types';
import { CardFrame, SayThis } from './CardFrame';

type Dismiss = { onDismiss: () => void };

export const IssueCard = ({
  event,
  onDismiss,
}: Dismiss & { event: IssueDetectedEvent }) => {
  const { t } = useAppI18n();
  const chips = [event.product, event.feature, event.platform, event.severity];
  return (
    <CardFrame
      icon="🚨"
      title={t('wwsd.card.issue', 'Issue detected')}
      model={event.model}
      onDismiss={onDismiss}
    >
      <p className="rd__wwsd-card__lead">{event.summary}</p>
      <div className="rd__wwsd-chips">
        {chips.filter(Boolean).map((chip) => (
          <span key={chip} className="rd__wwsd-chip">
            {chip}
          </span>
        ))}
      </div>
    </CardFrame>
  );
};

export const DocsCard = ({
  event,
  onDismiss,
}: Dismiss & { event: DocsSuggestionEvent }) => {
  const { t } = useAppI18n();
  return (
    <CardFrame
      icon="📚"
      title={t('wwsd.card.docs', 'Docs')}
      onDismiss={onDismiss}
    >
      {(event.items ?? []).map((item) => (
        <div key={item.url || item.title} className="rd__wwsd-card__section">
          <a href={item.url} target="_blank" rel="noreferrer">
            {item.title}
          </a>
          <p>{item.summary}</p>
          <SayThis text={item.say_this} />
        </div>
      ))}
    </CardFrame>
  );
};

const formatFact = (value: unknown) =>
  typeof value === 'object' ? JSON.stringify(value) : String(value);

export const PersonaCard = ({
  event,
  onDismiss,
}: Dismiss & { event: PersonaInsightEvent }) => {
  const { t } = useAppI18n();
  const facts = Object.entries(event.facts ?? {});
  return (
    <CardFrame
      icon={event.emoji}
      title={event.display_name}
      badge={t('wwsd.card.ai', 'AI')}
      model={event.model}
      onDismiss={onDismiss}
    >
      {facts.length > 0 && (
        <div className="rd__wwsd-chips">
          {facts.map(([key, value]) => (
            <span key={key} className="rd__wwsd-chip">
              {key.replace(/_/g, ' ')}: {formatFact(value)}
            </span>
          ))}
        </div>
      )}
      <SayThis
        text={event.line}
        label={event.for === 'rep' ? 'Read:' : 'Say:'}
      />
      {event.spoken && <p className="rd__wwsd-muted">🔊 spoken on the call</p>}
    </CardFrame>
  );
};
