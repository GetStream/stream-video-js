import {
  DefaultParticipantViewUI,
  PaginatedGridLayout,
} from '@stream-io/video-react-sdk';
import { useConfigurationContext } from '../../ConfigurationContext';

import './GridView.scss';

export const GridView = () => {
  // const setParticipantVideoRef = useEgressReadyWhenAnyParticipantMounts();
  const {
    layout: { gridSize },
  } = useConfigurationContext();
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
        groupSize={gridSize}
      />
    </div>
  );
};
