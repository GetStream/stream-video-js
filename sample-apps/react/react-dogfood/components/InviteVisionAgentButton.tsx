import { useState } from 'react';
import { Icon, useCall, useI18n } from '@stream-io/video-react-sdk';

export const InviteVisionAgentButton = () => {
  const call = useCall();
  const { t } = useI18n();
  const [isInviting, setIsInviting] = useState(false);

  const onClick = async () => {
    if (!call?.id || isInviting) return;
    setIsInviting(true);
    try {
      const response = await fetch(
        `https://api.demo.visionagents.ai/calls/${call.id}/sessions`,
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
    } catch (err) {
      console.error('Failed to invite vision agent', err);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <button
      type="button"
      className="rd__header__vision-agent"
      onClick={onClick}
      disabled={!call?.id || isInviting}
    >
      <Icon className="rd__header__vision-agent-icon" icon="support-agent" />
      {isInviting ? t('Inviting…') : t('Vision Agent')}
    </button>
  );
};
