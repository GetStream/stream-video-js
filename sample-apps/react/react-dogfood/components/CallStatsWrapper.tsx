import { CallStats, CompositeButton, Icon } from '@stream-io/video-react-sdk';

export const ToggleStatsButton = (props: {
  active?: boolean;
  onClick?: () => void;
}) => {
  const { active, onClick } = props;
  return (
    <CompositeButton
      active={active}
      variant="primary"
      title="Stats"
      onClick={onClick}
    >
      <Icon icon="stats" />
    </CompositeButton>
  );
};

export const CallStatsSidebar = () => {
  return (
    <div className="rd__sidebar__call-stats">
      <CallStats />
    </div>
  );
};
