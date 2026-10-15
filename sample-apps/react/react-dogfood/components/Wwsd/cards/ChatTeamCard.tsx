import { useState } from 'react';
import { useAppI18n } from '../../../hooks/useAppI18n';
import { useNow } from '../useNow';
import { useWwsd } from '../WwsdContext';
import { CardFrame } from './CardFrame';

const STILL_WAITING_AFTER_S = 90;

const DraftEditor = (props: { initial: string }) => {
  const { t } = useAppI18n();
  const { actions, isPending } = useWwsd();
  const [draft, setDraft] = useState(props.initial);
  return (
    <>
      <textarea
        className="rd__wwsd-draft"
        rows={5}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button
        className="rd__button rd__button--primary"
        disabled={!draft.trim() || isPending('sendChatQuestion')}
        onClick={() => {
          actions
            .sendChatQuestion(draft)
            .catch((err) => console.warn('[wwsd] send failed', err));
        }}
      >
        {t('wwsd.chatTeam.send', 'Send to Slack')}
      </button>
    </>
  );
};

const Waiting = (props: { since: number }) => {
  const { t } = useAppI18n();
  const now = useNow(1000);
  const elapsed = Math.max(0, Math.round(now - props.since));
  return (
    <p className="rd__wwsd-muted">
      {elapsed >= STILL_WAITING_AFTER_S
        ? t('wwsd.chatTeam.stillWaiting', 'Still waiting...')
        : t('wwsd.chatTeam.waiting', 'Asked, waiting...')}{' '}
      {elapsed}s
    </p>
  );
};

export const ChatTeamCard = (props: { onDismiss: () => void }) => {
  const { t } = useAppI18n();
  const { state } = useWwsd();
  const slack = state.slack;
  if (!slack) return null;
  return (
    <CardFrame
      icon="💬"
      title={t('wwsd.chatTeam.title', 'Chat team')}
      onDismiss={props.onDismiss}
    >
      {slack.draft !== undefined && !slack.posted && (
        <DraftEditor key={slack.draft} initial={slack.draft} />
      )}
      {slack.posted && (
        <>
          <p>{slack.posted.text}</p>
          {slack.posted.permalink && (
            <a href={slack.posted.permalink} target="_blank" rel="noreferrer">
              {t('wwsd.chatTeam.openThread', 'Open thread')}
            </a>
          )}
          {!slack.answer && <Waiting since={slack.posted.ts} />}
        </>
      )}
      {slack.answer && (
        <div className="rd__wwsd-card__section">
          <p className="rd__wwsd-card__lead">
            {t('wwsd.chatTeam.answer', 'Chat team ({{ from }}):', {
              from: slack.answer.from,
            })}
          </p>
          <p>{slack.answer.text}</p>
          {slack.answer.permalink && (
            <a href={slack.answer.permalink} target="_blank" rel="noreferrer">
              {t('wwsd.chatTeam.openReply', 'Open reply')}
            </a>
          )}
        </div>
      )}
    </CardFrame>
  );
};
