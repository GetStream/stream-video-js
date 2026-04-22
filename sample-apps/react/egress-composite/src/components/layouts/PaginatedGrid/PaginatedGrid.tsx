import { PaginatedGridLayout } from '@stream-io/video-react-sdk';

import { useConfigurationContext } from '../../../ConfigurationContext';
import { EgressReadyParticipantViewUI } from '../EgressReadyParticipantViewUI';

import './PaginatedGrid.scss';

export const PaginatedGrid = () => {
  const {
    options: {
      'layout.grid.page_size': pageSize = 20,
      'layout.forceMirrorParticipants': forceMirrorParticipants,
      'participant.filter': filterParticipants,
    },
  } = useConfigurationContext();

  return (
    <div className="paginated-grid" data-testid="grid">
      <PaginatedGridLayout
        ParticipantViewUI={
          <EgressReadyParticipantViewUI
            indicatorsVisible={false}
            showMenuButton={false}
          />
        }
        excludeLocalParticipant
        filterParticipants={filterParticipants}
        pageArrowsVisible={false}
        groupSize={pageSize}
        mirrorLocalParticipantVideo={forceMirrorParticipants !== false}
      />
    </div>
  );
};
