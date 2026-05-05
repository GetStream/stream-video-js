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
  sessionId,
  onSessionCreated,
  onSessionCleared,
}: {
  sessionId: string | null;
  onSessionCreated: (sessionId: string | null) => void;
  onSessionCleared: () => void;
}) => {
  const call = useCall();
  const { t } = useI18n();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const [isInviting, setIsInviting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const agentParticipant = participants.find((p) =>
    p.userId?.startsWith('agent'),
  );
  const isAgentInCall = !!agentParticipant;
  const isBusy = isInviting || isRemoving;

  const invite = async () => {
    if (!call?.id) return;
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

  const remove = async () => {
    if (!call || !agentParticipant) return;
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

  const onClick = () => {
    if (!call?.id || isBusy) return;
    if (isAgentInCall) return remove();
    return invite();
  };

  const label = isInviting
    ? t('Inviting…')
    : isRemoving
      ? t('Removing…')
      : isAgentInCall
        ? t('Remove Agent')
        : t('Ask AI Agent');

  return (
    <WithTooltip title={label}>
      <button
        type="button"
        className="rd__ask-ai-agent"
        onClick={onClick}
        disabled={!call?.id || isBusy}
      >
        <SparkleIcon />
        <span className="rd__ask-ai-agent__label">{label}</span>
      </button>
    </WithTooltip>
  );
};
