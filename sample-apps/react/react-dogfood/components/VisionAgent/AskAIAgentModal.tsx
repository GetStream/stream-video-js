import { useEffect, useRef, useState } from 'react';
import { Icon, IconButton, useCall, useI18n } from '@stream-io/video-react-sdk';

const VISION_AGENTS_BUILD_URL = 'https://visionagents.ai/';
const VISION_AGENTS_API_BASE = 'https://api.demo.visionagents.ai';

const Card = ({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) => (
  <div className="rd__ask-ai-modal__card">
    <div className="rd__ask-ai-modal__card-icon">
      <Icon icon={icon} />
    </div>
    <div className="rd__ask-ai-modal__card-title">{title}</div>
    <div className="rd__ask-ai-modal__card-description">{description}</div>
  </div>
);

export const AskAIAgentModal = ({
  onClose,
  onSessionCreated,
}: {
  onClose: () => void;
  onSessionCreated: (sessionId: string | null) => void;
}) => {
  const call = useCall();
  const { t } = useI18n();
  const [isInviting, setIsInviting] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const onInvite = async () => {
    if (!call?.id || isInviting) return;
    setIsInviting(true);
    try {
      const response = await fetch(
        `${VISION_AGENTS_API_BASE}/calls/${call.id}/sessions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ call_type: call.type ?? 'default' }),
        },
      );
      if (!response.ok) {
        throw new Error(
          `Vision Agents responded with ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      onSessionCreated(data.session_id ?? null);
      onClose();
    } catch (err) {
      console.error('Failed to invite vision agent', err);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="rd__ask-ai-modal__backdrop" onClick={onClose}>
      <div
        className="rd__ask-ai-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rd__ask-ai-modal__heading"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="rd__ask-ai-modal__header">
          <h2
            id="rd__ask-ai-modal__heading"
            className="rd__ask-ai-modal__heading"
          >
            {t('Ask an AI agent')}
          </h2>
          <IconButton
            ref={closeButtonRef}
            className="rd__ask-ai-modal__close"
            icon="close"
            onClick={onClose}
          />
        </div>
        <p className="rd__ask-ai-modal__description">
          {t('Add an AI agent to this call…')}
        </p>
        <div className="rd__ask-ai-modal__cards">
          <Card
            icon="mic"
            title={t('Talk to it')}
            description={t('Real-time voice conversation')}
          />
          <Card
            icon="chat"
            title={t('Knows Stream')}
            description={t('Ask about our SDKs, APIs, and products')}
          />
        </div>
        <div className="rd__ask-ai-modal__actions">
          <button
            type="button"
            className="rd__ask-ai-modal__invite"
            onClick={onInvite}
            disabled={isInviting || !call?.id}
          >
            {isInviting ? t('Inviting…') : t('Invite agent')}
          </button>
          <a
            className="rd__ask-ai-modal__build"
            href={VISION_AGENTS_BUILD_URL}
            target="_blank"
            rel="noreferrer"
          >
            {t('Build your own AI Agent')} →
          </a>
        </div>
        <p className="rd__ask-ai-modal__footer">
          {t('The AI agent leaves the call after 5 minutes.')}
        </p>
        <p className="rd__ask-ai-modal__powered-by">
          ✦ {t('Powered by Vision Agents')}
        </p>
      </div>
    </div>
  );
};
