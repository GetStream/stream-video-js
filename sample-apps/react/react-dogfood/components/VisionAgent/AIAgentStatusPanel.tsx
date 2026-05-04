import { useState } from 'react';
import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';

const VISION_AGENTS_BUILD_URL = 'https://visionagents.ai/';
const VISION_AGENTS_API_BASE = 'https://api.demo.visionagents.ai';

export const AIAgentStatusPanel = ({
  sessionId,
  onSessionCleared,
}: {
  sessionId: string | null;
  onSessionCleared: () => void;
}) => {
  const call = useCall();
  const { t } = useI18n();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const [isRemoving, setIsRemoving] = useState(false);

  const agentParticipant = participants.find((p) =>
    p.userId?.startsWith('agent-'),
  );
  if (!call || !agentParticipant) return null;

  const onRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      let removed = false;
      if (sessionId) {
        try {
          const response = await fetch(
            `${VISION_AGENTS_API_BASE}/calls/${call.id}/sessions/${sessionId}`,
            { method: 'DELETE' },
          );
          if (response.ok) removed = true;
        } catch (err) {
          console.error(
            'Vision Agents DELETE failed, falling back to kickUser',
            err,
          );
        }
      }
      if (!removed) {
        await call.kickUser({ user_id: agentParticipant.userId });
      }
      onSessionCleared();
    } catch (err) {
      console.error('Failed to remove vision agent', err);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="rd__ai-agent-status">
      <div className="rd__ai-agent-status__row">
        <span className="rd__ai-agent-status__dot" aria-hidden="true" />
        <span className="rd__ai-agent-status__label">
          {t('AI agent in call')}
        </span>
        <button
          type="button"
          className="rd__ai-agent-status__remove"
          onClick={onRemove}
          disabled={isRemoving}
        >
          {t('Remove')}
        </button>
      </div>
      <a
        className="rd__ai-agent-status__build"
        href={VISION_AGENTS_BUILD_URL}
        target="_blank"
        rel="noreferrer"
      >
        {t('Build your own AI Agent')} →
      </a>
      <p className="rd__ai-agent-status__powered-by">
        ✦ {t('Powered by Vision Agents')}
      </p>
    </div>
  );
};
