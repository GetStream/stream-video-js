import { useState } from 'react';
import {
  useCall,
  useCallStateHooks,
  useI18n,
  WithTooltip,
} from '@stream-io/video-react-sdk';

const VISION_AGENTS_API_BASE = 'https://api.demo.visionagents.ai';

const SparkleIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M7 0.5L8.4 5.6L13.5 7L8.4 8.4L7 13.5L5.6 8.4L0.5 7L5.6 5.6L7 0.5Z"
      fill="currentColor"
    />
  </svg>
);

export const AskAIAgentButton = ({
  onSessionCreated,
}: {
  onSessionCreated: (sessionId: string | null) => void;
}) => {
  const call = useCall();
  const { t } = useI18n();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const [isInviting, setIsInviting] = useState(false);

  const isAgentInCall = participants.some((p) => p.userId?.startsWith('agent'));

  const onClick = async () => {
    if (!call?.id || isInviting || isAgentInCall) return;
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
    } catch (err) {
      console.error('Failed to invite vision agent', err);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <WithTooltip title={t('Ask AI Agent')}>
      <button
        type="button"
        className="rd__ask-ai-agent"
        onClick={onClick}
        disabled={!call?.id || isInviting || isAgentInCall}
      >
        <SparkleIcon />
        <span className="rd__ask-ai-agent__label">
          {isInviting ? t('Inviting…') : t('Ask AI Agent')}
        </span>
      </button>
    </WithTooltip>
  );
};
