import {
  DefaultParticipantViewUI,
  PaginatedGridLayout,
} from '@stream-io/video-react-sdk';
import { useConfigurationContext } from '../../../ConfigurationContext';

import './PaginatedGrid.scss';

export const PaginatedGrid = () => {
  const {
    options: {
      'layout.grid.page_size': pageSize = 20,
      'participant.filter': filterParticipants,
    },
  } = useConfigurationContext();

  return (
    <div className="paginated-grid" data-testid="grid">
      <PaginatedGridLayout
        ParticipantViewUI={
          <DefaultParticipantViewUI
            indicatorsVisible={false}
            showMenuButton={false}
          />
        }
        excludeLocalParticipant
        filterParticipants={filterParticipants}
        pageArrowsVisible={false}
        groupSize={pageSize}
      />
    </div>
  );
};
