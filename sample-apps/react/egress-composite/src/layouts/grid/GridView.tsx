import { PaginatedGridLayout } from '@stream-io/video-react-sdk';
import { useAppConfig } from '../../hooks/useAppConfig';

import './GridView.scss';

export const GridView = () => {
  // const setParticipantVideoRef = useEgressReadyWhenAnyParticipantMounts();
  const { gridSize } = useAppConfig();
  return (
    <div className="grid-view">
      <PaginatedGridLayout
        excludeLocalParticipant
        indicatorsVisible={false}
        groupSize={gridSize || 25}
      />
    </div>
  );
};
