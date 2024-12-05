import {
  DefaultParticipantViewUI,
  SpeakerLayout,
} from '@stream-io/video-react-sdk';
import { useConfigurationContext } from '../../../ConfigurationContext';

import './Spotlight.scss';
import { useFilterParticipantByRole } from '../../../hooks/useFilterParticipantsByRole';

export const Spotlight = () => {
  const {
    options: {
      'layout.spotlight.participants_bar_position': position = 'bottom',
      'layout.spotlight.participants_bar_limit': limit = 'dynamic',
      'participant.include_roles': includeRoles,
    },
  } = useConfigurationContext();
  const filterParticipants = useFilterParticipantByRole(includeRoles);

  return (
    <div className="spotlight" data-testid="spotlight">
      <SpeakerLayout
        participantsBarPosition={position}
        participantsBarLimit={limit}
        excludeLocalParticipant
        filterParticipants={filterParticipants}
        pageArrowsVisible={false}
        ParticipantViewUIBar={
          <DefaultParticipantViewUI
            indicatorsVisible={false}
            showMenuButton={false}
          />
        }
        ParticipantViewUISpotlight={
          <DefaultParticipantViewUI
            indicatorsVisible={false}
            showMenuButton={false}
          />
        }
      />
    </div>
  );
};
