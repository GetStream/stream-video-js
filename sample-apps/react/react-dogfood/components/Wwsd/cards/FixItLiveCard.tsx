import clsx from 'clsx';
import { useAppI18n } from '../../../hooks/useAppI18n';
import { WORKFLOW_STEPS, WorkflowStepName } from '../types';
import { useWwsd } from '../WwsdContext';
import { CardFrame } from './CardFrame';

const STEP_LABELS: Record<WorkflowStepName, string> = {
  ticket: 'Ticket',
  pickup: 'Pickup',
  fix: 'Fix',
  pr: 'Pull request',
  approve: 'Approve',
  deployed: 'Deployed',
  done: 'Fix live',
};

const STATUS_ICONS = { running: '⏳', ok: '✅', failed: '❌' } as const;

export const FixItLiveCard = (props: { onDismiss: () => void }) => {
  const { t } = useAppI18n();
  const { state, actions, isPending } = useWwsd();
  const workflow = state.workflow;
  if (!workflow) return null;
  const awaitingApproval = workflow.approve?.status === 'running';
  return (
    <CardFrame
      icon="🛠️"
      title={t('wwsd.fix.title', 'Fix it live')}
      onDismiss={props.onDismiss}
    >
      <ol className="rd__wwsd-timeline">
        {WORKFLOW_STEPS.map((name) => {
          const step = workflow[name];
          return (
            <li
              key={name}
              className={clsx(
                'rd__wwsd-timeline__step',
                step && `rd__wwsd-timeline__step--${step.status}`,
              )}
            >
              <span aria-hidden>{step ? STATUS_ICONS[step.status] : '○'}</span>{' '}
              {step?.url ? (
                <a href={step.url} target="_blank" rel="noreferrer">
                  {STEP_LABELS[name]}
                </a>
              ) : (
                STEP_LABELS[name]
              )}
              {step?.detail && (
                <span className="rd__wwsd-muted"> · {step.detail}</span>
              )}
            </li>
          );
        })}
      </ol>
      {awaitingApproval && (
        <button
          className="rd__button rd__button--primary"
          disabled={isPending('approveFix')}
          onClick={() => {
            actions
              .approveFix()
              .catch((err) => console.warn('[wwsd] approve failed', err));
          }}
        >
          {t('wwsd.fix.approve', 'Approve fix')}
        </button>
      )}
    </CardFrame>
  );
};
