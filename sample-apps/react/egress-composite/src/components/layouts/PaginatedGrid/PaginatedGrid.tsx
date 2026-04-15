import {
  DefaultParticipantViewUI,
  PaginatedGridLayout,
} from '@stream-io/video-react-sdk';
import { cx } from '@emotion/css';
import { useConfigurationContext } from '../../../ConfigurationContext';

import './PaginatedGrid.scss';

export const PaginatedGrid = () => {
  const {
    options: {
      'layout.grid.page_size': pageSize = 20,
      'layout.grid.size_constraints': sizeConstraints = false,
      'layout.forceMirrorParticipants': forceMirrorParticipants,
      'participant.filter': filterParticipants,
    },
  } = useConfigurationContext();

  return (
    <div
      className={cx(
        'paginated-grid',
        sizeConstraints && 'paginated-grid--size-constrained',
      )}
      data-testid="grid"
    >
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
        mirrorLocalParticipantVideo={forceMirrorParticipants !== false}
      />
    </div>
  );
};
