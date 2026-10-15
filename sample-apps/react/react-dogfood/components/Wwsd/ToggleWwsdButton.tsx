import { CompositeButton, WithTooltip } from '@stream-io/video-react-sdk';
import { useAppI18n } from '../../hooks/useAppI18n';

export const ToggleWwsdButton = (props: {
  active?: boolean;
  onClick?: () => void;
}) => {
  const { active, onClick } = props;
  const { t } = useAppI18n();
  const title = t('wwsd.toggle.title', 'WWSD copilot');
  return (
    <WithTooltip title={title}>
      <CompositeButton active={active} title={title} onClick={onClick}>
        <span className="rd__wwsd-toggle" aria-hidden>
          🦸
        </span>
      </CompositeButton>
    </WithTooltip>
  );
};
