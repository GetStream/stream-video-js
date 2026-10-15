import { useCall } from '@stream-io/video-react-sdk';
import { useState } from 'react';
import { useAppI18n } from '../../hooks/useAppI18n';
import { useWwsd } from './WwsdContext';

export const RecapModal = (props: {
  onClose: () => void;
  onLeave: () => void;
}) => {
  const { onClose, onLeave } = props;
  const { t } = useAppI18n();
  const call = useCall();
  const { state, actions, isPending, error, clearError } = useWwsd();
  const [slackResult, setSlackResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const recap = state.recap;

  const copy = (what: string, text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setCopied(what))
      .catch((err) => console.warn('[wwsd] copy failed', err));
  };

  const leave = () => {
    const left = call ? call.leave() : Promise.resolve();
    left.then(onLeave).catch((err) => console.warn('[wwsd] leave failed', err));
  };

  const postToSlack = (markdown: string) => {
    actions
      .postRecapToSlack(markdown)
      .then((permalink) => setSlackResult(permalink ?? null))
      .catch((err) => console.warn('[wwsd] recap to slack failed', err));
  };

  return (
    <div className="rd__wwsd-modal" role="dialog" onClick={onClose}>
      <div
        className="rd__wwsd-modal__content"
        onClick={(e) => e.stopPropagation()}
      >
        {error && (
          <p className="rd__wwsd-notice rd__wwsd-notice--error">{error}</p>
        )}
        {!recap && !(error && !isPending('recap')) && (
          <p className="rd__wwsd-muted">
            {t('wwsd.recap.loading', 'Writing the recap...')}
          </p>
        )}
        {!recap && !isPending('recap') && error && (
          <div className="rd__wwsd-modal__actions">
            <button
              className="rd__button"
              onClick={() => {
                clearError();
                actions
                  .requestRecap()
                  .catch((err) => console.warn('[wwsd] recap failed', err));
              }}
            >
              {t('wwsd.recap.retry', 'Try again')}
            </button>
          </div>
        )}
        {recap && (
          <>
            <h2>{recap.title}</h2>
            {(recap.sections ?? []).map((section) => (
              <section key={section.title}>
                <h3>{section.title}</h3>
                <ul>
                  {(section.items ?? []).map((item) => (
                    <li key={item.text}>
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noreferrer">
                          {item.text}
                        </a>
                      ) : (
                        item.text
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <section>
              <h3>{t('wwsd.recap.email', 'Follow-up email')}</h3>
              <p className="rd__wwsd-muted">
                {recap.email_to} · {recap.email_subject}
              </p>
              <pre className="rd__wwsd-modal__email">{recap.email_body}</pre>
            </section>
            <div className="rd__wwsd-modal__actions">
              <button
                className="rd__button"
                onClick={() =>
                  copy(
                    'email',
                    `Subject: ${recap.email_subject}\n\n${recap.email_body}`,
                  )
                }
              >
                {copied === 'email'
                  ? t('wwsd.share.copied', 'Copied ✓')
                  : t('wwsd.recap.copyEmail', 'Copy email')}
              </button>
              <a
                className="rd__button"
                href={`mailto:${recap.email_to}?subject=${encodeURIComponent(recap.email_subject)}&body=${encodeURIComponent(recap.email_body)}`}
              >
                {t('wwsd.recap.openMail', 'Open in mail')}
              </a>
              <button
                className="rd__button"
                onClick={() => copy('markdown', recap.markdown)}
              >
                {copied === 'markdown'
                  ? t('wwsd.share.copied', 'Copied ✓')
                  : t('wwsd.recap.copyMarkdown', 'Copy CRM note')}
              </button>
              {slackResult === null ? (
                <button
                  className="rd__button"
                  disabled={isPending('recapSlack')}
                  onClick={() => postToSlack(recap.markdown)}
                >
                  {t('wwsd.recap.slack', 'Post to Slack')}
                </button>
              ) : slackResult ? (
                <a
                  className="rd__button"
                  href={slackResult}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('wwsd.recap.slackPosted', 'Posted ✓')}
                </a>
              ) : (
                <span className="rd__wwsd-muted">
                  {t('wwsd.recap.slackMissing', 'Slack not configured')}
                </span>
              )}
              {state.followupTask ? (
                <a
                  className="rd__button"
                  href={state.followupTask.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {state.followupTask.identifier}
                </a>
              ) : (
                <button
                  className="rd__button"
                  disabled={isPending('followupTask')}
                  onClick={() => {
                    actions
                      .createFollowupTask()
                      .catch((err) =>
                        console.warn('[wwsd] follow-up task failed', err),
                      );
                  }}
                >
                  {t('wwsd.recap.task', 'Create follow-up task')}
                </button>
              )}
            </div>
          </>
        )}
        <div className="rd__wwsd-modal__actions">
          <button className="rd__button" onClick={onClose}>
            {t('wwsd.recap.close', 'Close')}
          </button>
          <button className="rd__button rd__button--primary" onClick={leave}>
            {t('wwsd.recap.leave', 'Leave call')}
          </button>
        </div>
      </div>
    </div>
  );
};
