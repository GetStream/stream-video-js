import clsx from 'clsx';
import { useState } from 'react';
import { useAppI18n } from '../../hooks/useAppI18n';
import { isWorkflowRunning } from './reducer';
import { useWwsd } from './WwsdContext';

export const ActionBar = () => {
  const { t } = useAppI18n();
  const { state, actions, isPending } = useWwsd();
  const [speak, setSpeak] = useState(false);
  const fixRunning = isWorkflowRunning(state.workflow);

  const fire = (label: string, promise: Promise<unknown>) => {
    promise.catch((err) => console.warn(`[wwsd] ${label} failed`, err));
  };

  return (
    <div className="rd__wwsd-actions">
      <div className="rd__wwsd-actions__experts">
        {state.personas.map((persona) => {
          const reason = state.suggestedPersonas[persona.id];
          return (
            <button
              key={persona.id}
              className={clsx(
                'rd__wwsd-expert',
                reason && 'rd__wwsd-expert--suggested',
              )}
              title={reason}
              disabled={isPending(`persona:${persona.id}`)}
              onClick={() =>
                fire('persona', actions.runPersona(persona.id, speak))
              }
            >
              <span aria-hidden>{persona.emoji}</span>{' '}
              {persona.button_label || persona.display_name}
            </button>
          );
        })}
      </div>
      <div className="rd__wwsd-actions__row">
        <label className="rd__wwsd-actions__speak">
          <input
            type="checkbox"
            checked={speak}
            onChange={(e) => setSpeak(e.target.checked)}
          />{' '}
          {t('wwsd.actions.speak', '🔊 Let them say it')}
        </label>
        <button
          className="rd__button rd__button--secondary"
          disabled={isPending('draftChatQuestion')}
          onClick={() => fire('ask chat team', actions.draftChatQuestion())}
        >
          {t('wwsd.actions.askChatTeam', 'Ask chat team')}
        </button>
        <button
          className="rd__button rd__button--primary"
          disabled={fixRunning || isPending('fixItLive')}
          onClick={() => fire('fix it live', actions.startFixItLive())}
        >
          {t('wwsd.actions.fixItLive', 'Fix it live')}
        </button>
      </div>
    </div>
  );
};
