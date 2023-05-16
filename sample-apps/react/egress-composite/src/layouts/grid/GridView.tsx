import {
  PaginatedGridLayout,
  DefaultParticipantViewUI,
  ParticipantViewUIProps,
} from '@stream-io/video-react-sdk';
import { useAppConfig } from '../../hooks/useAppConfig';

import './GridView.scss';

const CustomParticipantViewUI = ({ participant }: ParticipantViewUIProps) => (
  <DefaultParticipantViewUI
    indicatorsVisible={false}
    participant={participant}
  />
);

export const GridView = () => {
  // const setParticipantVideoRef = useEgressReadyWhenAnyParticipantMounts();
  const { gridSize } = useAppConfig();
  return (
    <div className="grid-view">
      <PaginatedGridLayout
        ParticipantViewUI={CustomParticipantViewUI}
        excludeLocalParticipant
        groupSize={gridSize || 25}
      />
    </div>
  );
};
