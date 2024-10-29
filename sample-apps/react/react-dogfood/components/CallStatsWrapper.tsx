import {
  CallStats,
  CompositeButton,
  Icon,
  useI18n,
  WithTooltip,
} from '@stream-io/video-react-sdk';

export const ToggleStatsButton = (props: {
  active?: boolean;
  onClick?: () => void;
}) => {
  const { active, onClick } = props;
  const { t } = useI18n();
  return (
    <WithTooltip title={t('Stats')}>
      <CompositeButton
        active={active}
        variant="primary"
        title="Stats"
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
