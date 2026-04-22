import { SpeakerLayout } from '@stream-io/video-react-sdk';

import { useConfigurationContext } from '../../../ConfigurationContext';
import { EgressReadyParticipantViewUI } from '../EgressReadyParticipantViewUI';

import './Spotlight.scss';

export const Spotlight = () => {
  const {
    options: {
      'layout.spotlight.participants_bar_position': position = 'bottom',
      'layout.spotlight.participants_bar_limit': limit = 'dynamic',
      'layout.forceMirrorParticipants': forceMirrorParticipants,
      'participant.filter': filterParticipants,
    },
  } = useConfigurationContext();

  return (
    <div className="spotlight" data-testid="spotlight">
      <SpeakerLayout
        participantsBarPosition={position}
        participantsBarLimit={limit}
        excludeLocalParticipant
        filterParticipants={filterParticipants}
        pageArrowsVisible={false}
        mirrorLocalParticipantVideo={forceMirrorParticipants !== false}
        ParticipantViewUIBar={
          <EgressReadyParticipantViewUI
            indicatorsVisible={false}
            showMenuButton={false}
          />
        }
        ParticipantViewUISpotlight={
          <EgressReadyParticipantViewUI
            indicatorsVisible={false}
            showMenuButton={false}
          />
        }
      />
    </div>
  );
};
