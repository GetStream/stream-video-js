import {
  CallStats,
  CompositeButton,
  IconButton,
} from '@stream-io/video-react-sdk';

export const ToggleStatsButton = (props: {
  active?: boolean;
  onClick?: () => void;
}) => {
  const { active, onClick } = props;
  return (
    <CompositeButton active={active} variant="primary">
      <IconButton icon="stats" title="Stats" onClick={onClick} />
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
