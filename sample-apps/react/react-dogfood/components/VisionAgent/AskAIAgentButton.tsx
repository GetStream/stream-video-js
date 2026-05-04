import clsx from 'clsx';
import { useI18n, WithTooltip } from '@stream-io/video-react-sdk';

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
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) => {
  const { t } = useI18n();
  return (
    <WithTooltip title={t('Ask AI Agent')}>
      <button
        type="button"
        className={clsx('rd__ask-ai-agent', {
          'rd__ask-ai-agent--active': active,
        })}
        onClick={onClick}
      >
        <SparkleIcon />
        <span className="rd__ask-ai-agent__label">{t('Ask AI Agent')}</span>
      </button>
    </WithTooltip>
  );
};
