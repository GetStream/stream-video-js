import {
  DefaultParticipantViewUI,
  PaginatedGridLayout,
} from '@stream-io/video-react-sdk';
import { useAppConfig } from '../../hooks/useAppConfig';

import './GridView.scss';

export const GridView = () => {
  const { gridSize } = useAppConfig();
  return (
    <div className="grid-view">
      <PaginatedGridLayout
        ParticipantViewUI={
          <DefaultParticipantViewUI
            indicatorsVisible={false}
            showMenuButton={false}
          />
        }
        excludeLocalParticipant
        groupSize={gridSize || 25}
      />
    </div>
  );
};
