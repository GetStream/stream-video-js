import {
  CallStats,
  CompositeButton,
  Icon,
  WithTooltip,
} from '@stream-io/video-react-sdk';
import { useAppI18n } from '../hooks/useAppI18n';

export const ToggleStatsButton = (props: {
  active?: boolean;
  onClick?: () => void;
}) => {
  const { active, onClick } = props;
  const { t } = useAppI18n();
  return (
    <WithTooltip title={t('callControls.statsButton.stats.title', 'Stats')}>
      <CompositeButton
        active={active}
        title={t('callControls.statsButton.stats.title', 'Stats')}
        onClick={onClick}
      >
        <Icon icon="stats" />
      </CompositeButton>
    </WithTooltip>
  );
};

export const CallStatsSidebar = () => {
  return (
    <div className="rd__sidebar__call-stats">
      <CallStats showCodecInfo />
    </div>
  );
};
