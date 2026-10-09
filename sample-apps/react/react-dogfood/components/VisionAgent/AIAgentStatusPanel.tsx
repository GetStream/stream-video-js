import { useEffect, useState } from 'react';
import { IconButton, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useAppI18n } from '../../hooks/useAppI18n';

const VISION_AGENTS_BUILD_URL = 'https://getstream.io/vision-agents/';

export const AIAgentStatusPanel = () => {
  const { t } = useAppI18n();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const [dismissed, setDismissed] = useState(false);

  const agentParticipant = participants.find((p) =>
    p.userId?.startsWith('agent'),
  );
  const agentSessionId = agentParticipant?.sessionId;

  useEffect(() => {
    setDismissed(false);
  }, [agentSessionId]);

  if (!agentParticipant || dismissed) return null;

  return (
    <div className="rd__ai-agent-status">
      <div className="rd__ai-agent-status__row">
        <span className="rd__ai-agent-status__dot" aria-hidden="true" />
        <span className="rd__ai-agent-status__label">
          {t('visionAgent.status.inCall.text', 'AI agent in call')}
        </span>
        <IconButton
          className="rd__ai-agent-status__close"
          icon="close"
          onClick={() => setDismissed(true)}
          size="sm"
          variant="secondary"
        />
      </div>
      <a
        className="rd__ai-agent-status__build"
        href={VISION_AGENTS_BUILD_URL}
        target="_blank"
        rel="noreferrer"
      >
        {t('visionAgent.status.buildYourOwn.label', 'Build your own AI Agent')}{' '}
        →
      </a>
      <p className="rd__ai-agent-status__powered-by">
        ✦ {t('visionAgent.status.poweredBy.text', 'Powered by Vision Agents')}
      </p>
    </div>
  );
};
